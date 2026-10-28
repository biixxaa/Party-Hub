import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { requireApprovedVerification } from '../middleware/verificationGuard';
import { requireActiveSubscription } from '../middleware/subscriptionGuard';
import { uploadPostImage } from '../middleware/upload';
import { validateObjectFields } from '../utils/prohibitedPatterns';

const router = Router();

// Helper to auto-expire boosts older than 24 hours
async function checkAndExpireBoosts() {
  const now = new Date();
  await prisma.postBoost.updateMany({
    where: {
      status: 'ACTIVE',
      expirationTime: { lte: now },
    },
    data: { status: 'EXPIRED' },
  });
}

// 1. Promotional Feed (Accessible by authenticated users)
router.get('/feed', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Check & expire boosts first
    await checkAndExpireBoosts();

    const now = new Date();

    // Fetch posts: Active boosted posts first, then latest created posts
    const posts = await prisma.post.findMany({
      where: { isPublished: true },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        boosts: {
          where: {
            status: 'ACTIVE',
            expirationTime: { gt: now },
          },
          orderBy: { expirationTime: 'desc' },
          take: 1,
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format feed posts with boosted metadata and isLiked flag
    const formatted = posts.map(post => {
      const activeBoost = post.boosts.length > 0 ? post.boosts[0] : null;
      return {
        id: post.id,
        title: post.title,
        description: post.description,
        platformName: post.platformName,
        destinationLink: post.destinationLink,
        imageUrl: post.imageUrl ? `/uploads/posts/${post.imageUrl}` : null,
        creator: post.creator,
        likeCount: post.likeCount,
        viewCount: post.viewCount,
        isBoosted: !!activeBoost,
        boostExpiresAt: activeBoost?.expirationTime || null,
        isLiked: post.likes.length > 0,
        createdAt: post.createdAt,
      };
    });

    // Sort boosted posts to top of feed for higher visibility
    formatted.sort((a, b) => {
      if (a.isBoosted && !b.isBoosted) return -1;
      if (!a.isBoosted && b.isBoosted) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    res.json({ posts: formatted });
  } catch (error) {
    console.error('Fetch feed error:', error);
    res.status(500).json({ error: 'Failed to fetch promotional feed.' });
  }
});

// 2. Record Post View / Impression
router.post('/:id/view', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.user?.id;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';

    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    // Increment post view count and log view
    await prisma.$transaction([
      prisma.postView.create({
        data: {
          postId,
          userId,
          ipAddress: ip,
        },
      }),
      prisma.post.update({
        where: { id: postId },
        data: { viewCount: { increment: 1 } },
      }),
    ]);

    res.json({ success: true });
  } catch (error) {
    console.error('Record post view error:', error);
    res.status(500).json({ error: 'Failed to record impression.' });
  }
});

// 3. Like / Unlike Post (Agents Only)
router.post(
  '/:id/like',
  authenticateToken,
  requireRole(['AGENT']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const postId = req.params.id as string;
      const userId = req.user!.id;

      const post = await prisma.post.findUnique({ where: { id: postId } });
      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      // Check if already liked
      const existingLike = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      if (existingLike) {
        // Unlike post
        await prisma.$transaction([
          prisma.postLike.delete({
            where: { id: existingLike.id },
          }),
          prisma.post.update({
            where: { id: postId },
            data: { likeCount: { decrement: 1 } },
          }),
        ]);

        res.json({ liked: false, message: 'Post unliked successfully.' });
      } else {
        // Like post
        await prisma.$transaction([
          prisma.postLike.create({
            data: { postId, userId },
          }),
          prisma.post.update({
            where: { id: postId },
            data: { likeCount: { increment: 1 } },
          }),
        ]);

        res.json({ liked: true, message: 'Post liked successfully.' });
      }
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ error: 'Failed to update like status.' });
    }
  }
);

// 4. View who liked a post (Platform Creator or Admin)
router.get('/:id/likes', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { creatorId: true },
    });

    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    // Only post creator or Admin can view the list of Agents who liked
    if (post.creatorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      res.status(403).json({ error: 'Only the post creator or an Admin can view the list of likers.' });
      return;
    }

    const likes = await prisma.postLike.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            bio: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      likers: likes.map(l => ({
        ...l.user,
        likedAt: l.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch post likers error:', error);
    res.status(500).json({ error: 'Failed to fetch post likers.' });
  }
});

// 5. Creator: View and Manage Own Promotional Posts with stats & likers
router.get(
  '/my-posts',
  authenticateToken,
  requireRole(['PLATFORM_CREATOR']),
  requireApprovedVerification,
  requireActiveSubscription('CREATOR_PREMIUM'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const creatorId = req.user!.id;
      const now = new Date();

      await checkAndExpireBoosts();

      const posts = await prisma.post.findMany({
        where: { creatorId },
        include: {
          boosts: {
            where: {
              status: 'ACTIVE',
              expirationTime: { gt: now },
            },
            take: 1,
          },
          likes: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  bio: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const formatted = posts.map(post => {
        const activeBoost = post.boosts.length > 0 ? post.boosts[0] : null;
        return {
          id: post.id,
          title: post.title,
          description: post.description,
          platformName: post.platformName,
          destinationLink: post.destinationLink,
          imageUrl: post.imageUrl ? `/uploads/posts/${post.imageUrl}` : null,
          isPublished: post.isPublished,
          likeCount: post.likeCount,
          viewCount: post.viewCount,
          isBoosted: !!activeBoost,
          boostExpiresAt: activeBoost?.expirationTime || null,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          likedByAgents: post.likes.map(l => ({
            id: l.user.id,
            fullName: l.user.fullName,
            email: l.user.email,
            bio: l.user.bio,
            likedAt: l.createdAt,
          })),
        };
      });

      res.json({ posts: formatted });
    } catch (error) {
      console.error('Fetch my-posts error:', error);
      res.status(500).json({ error: 'Failed to fetch posts.' });
    }
  }
);

// 6. Creator: Create New Promotional Post
router.post(
  '/',
  authenticateToken,
  requireRole(['PLATFORM_CREATOR']),
  requireApprovedVerification,
  requireActiveSubscription('CREATOR_PREMIUM'),
  uploadPostImage.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const creatorId = req.user!.id;
      const { title, description, platformName, destinationLink } = req.body;

      if (!title || !description || !platformName || !destinationLink) {
        res.status(400).json({ error: 'Title, description, platform name, and destination link are all required.' });
        return;
      }

      // Prohibited Contact Info Validation (Section 7)
      const validation = validateObjectFields(
        { title, description, platformName, destinationLink },
        ['title', 'description', 'platformName', 'destinationLink']
      );

      if (!validation.isValid) {
        res.status(400).json({ error: validation.errorMessage });
        return;
      }

      const imageUrl = req.file ? req.file.filename : null;

      const post = await prisma.post.create({
        data: {
          creatorId,
          title: title.trim(),
          description: description.trim(),
          platformName: platformName.trim(),
          destinationLink: destinationLink.trim(),
          imageUrl,
          isPublished: true,
        },
      });

      res.status(201).json({
        message: 'Promotional post created successfully.',
        post: {
          ...post,
          imageUrl: post.imageUrl ? `/uploads/posts/${post.imageUrl}` : null,
        },
      });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: 'Failed to create promotional post.' });
    }
  }
);

// 7. Creator / Admin: Edit Promotional Post
router.put(
  '/:id',
  authenticateToken,
  uploadPostImage.single('image'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const postId = req.params.id as string;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const existingPost = await prisma.post.findUnique({ where: { id: postId } });
      if (!existingPost) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      // Authorization check
      if (existingPost.creatorId !== userId && userRole !== 'ADMIN') {
        res.status(403).json({ error: 'Unauthorized to edit this post.' });
        return;
      }

      const { title, description, platformName, destinationLink, isPublished } = req.body;

      // Prohibited Contact Validation
      const validation = validateObjectFields(
        { title, description, platformName, destinationLink },
        ['title', 'description', 'platformName', 'destinationLink']
      );

      if (!validation.isValid) {
        res.status(400).json({ error: validation.errorMessage });
        return;
      }

      const updated = await prisma.post.update({
        where: { id: postId },
        data: {
          ...(title ? { title: title.trim() } : {}),
          ...(description ? { description: description.trim() } : {}),
          ...(platformName ? { platformName: platformName.trim() } : {}),
          ...(destinationLink ? { destinationLink: destinationLink.trim() } : {}),
          ...(isPublished !== undefined ? { isPublished: isPublished === 'true' || isPublished === true } : {}),
          ...(req.file ? { imageUrl: req.file.filename } : {}),
        },
      });

      res.json({
        message: 'Post updated successfully.',
        post: {
          ...updated,
          imageUrl: updated.imageUrl ? `/uploads/posts/${updated.imageUrl}` : null,
        },
      });
    } catch (error) {
      console.error('Update post error:', error);
      res.status(500).json({ error: 'Failed to update post.' });
    }
  }
);

// 8. Creator / Admin: Delete Promotional Post
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const postId = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const existingPost = await prisma.post.findUnique({ where: { id: postId } });
    if (!existingPost) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    if (existingPost.creatorId !== userId && userRole !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized to delete this post.' });
      return;
    }

    await prisma.post.delete({ where: { id: postId } });

    res.json({ message: 'Post deleted successfully.' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

export default router;
