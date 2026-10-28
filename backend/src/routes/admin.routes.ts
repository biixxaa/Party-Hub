import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = Router();

// Protect ALL admin routes with server-side authorization
router.use(authenticateToken);
router.use(requireRole(['ADMIN']));

// 1. Overall Admin Statistics
router.get('/stats', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalAgents,
      totalCreators,
      pendingVerifications,
      totalPosts,
      activeBoosts,
      openTickets,
      payments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.user.count({ where: { role: 'PLATFORM_CREATOR' } }),
      prisma.verificationSubmission.count({ where: { status: 'PENDING' } }),
      prisma.post.count(),
      prisma.postBoost.count({ where: { status: 'ACTIVE', expirationTime: { gt: new Date() } } }),
      prisma.contactAdminTicket.count({ where: { status: 'OPEN' } }),
      prisma.payments.findMany({ where: { status: 'COMPLETED' }, select: { amount: true } }),
    ]);

    const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

    res.json({
      totalUsers,
      totalAgents,
      totalCreators,
      pendingVerifications,
      totalPosts,
      activeBoosts,
      openTickets,
      totalRevenue,
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform statistics.' });
  }
});

// 2. Identity Verification Submissions Management
router.get('/verifications', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;

    const where: any = {};
    if (statusParam && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusParam)) {
      where.status = statusParam;
    }

    const submissions = await prisma.verificationSubmission.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            verificationStatus: true,
            agencyCenter: true,
            platformId: true,
            superLevel: true,
            workedApp: true,
            workedAppId: true,
            experienceLevel: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Fetch verifications error:', error);
    res.status(500).json({ error: 'Failed to fetch verification submissions.' });
  }
});

// Admin sends direct verification challenge / message to user's shared ID
router.post('/verifications/:id/message', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { messageContent } = req.body;

    if (!messageContent || !messageContent.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty.' });
      return;
    }

    const submission = await prisma.verificationSubmission.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!submission) {
      res.status(404).json({ error: 'Verification submission not found.' });
      return;
    }

    const updatedSub = await prisma.verificationSubmission.update({
      where: { id },
      data: {
        adminDirectMessage: messageContent.trim(),
        adminMessageSentAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            verificationStatus: true,
            agencyCenter: true,
            platformId: true,
            superLevel: true,
            workedApp: true,
            workedAppId: true,
            experienceLevel: true,
            createdAt: true,
          },
        },
      },
    });

    res.json({
      message: `Direct verification prompt sent to ${submission.platformId || submission.user.fullName}. User can view verification instructions on their dashboard.`,
      submission: updatedSub,
    });
  } catch (error) {
    console.error('Send verification message error:', error);
    res.status(500).json({ error: 'Failed to record direct verification message.' });
  }
});

// Review Identity Verification (Approve or Reject, assign Experience Level A/B/C/D & confirm Super Level)
router.post('/verifications/:id/review', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status, rejectionReason, superLevel, agencyCenter, platformId, experienceLevel, workedApp, workedAppId } = req.body;
    const adminEmail = req.user!.email;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Status must be either APPROVED or REJECTED.' });
      return;
    }

    const submission = await prisma.verificationSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      res.status(404).json({ error: 'Verification submission not found.' });
      return;
    }

    // Format experienceLevel: A, B, C, D -> Level A, Level B, etc.
    let finalExperienceLevel = experienceLevel || submission.experienceLevel || 'Level B';
    if (['A', 'B', 'C', 'D'].includes(finalExperienceLevel)) {
      finalExperienceLevel = `Level ${finalExperienceLevel}`;
    }

    const finalSuperLevel = superLevel || submission.superLevel || 'Super Level 1';
    const finalAgencyCenter = agencyCenter || submission.agencyCenter;
    const finalPlatformId = platformId || submission.platformId;
    const finalWorkedApp = workedApp || submission.workedApp;
    const finalWorkedAppId = workedAppId || submission.workedAppId;

    // Update submission and update user verificationStatus
    const [updatedSub, updatedUser] = await prisma.$transaction([
      prisma.verificationSubmission.update({
        where: { id },
        data: {
          status,
          superLevel: finalSuperLevel,
          experienceLevel: finalExperienceLevel,
          workedApp: finalWorkedApp,
          workedAppId: finalWorkedAppId,
          rejectionReason: status === 'REJECTED' ? (rejectionReason || 'Identity verification could not be confirmed.') : null,
          reviewedAt: new Date(),
          reviewedBy: adminEmail,
        },
      }),
      prisma.user.update({
        where: { id: submission.userId },
        data: {
          verificationStatus: status,
          agencyCenter: finalAgencyCenter,
          platformId: finalPlatformId,
          superLevel: finalSuperLevel,
          experienceLevel: finalExperienceLevel,
          workedApp: finalWorkedApp,
          workedAppId: finalWorkedAppId,
        },
      }),
    ]);

    res.json({
      message: `Verification ${status.toLowerCase()} successfully with rating ${finalExperienceLevel}.`,
      submission: updatedSub,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        verificationStatus: updatedUser.verificationStatus,
        agencyCenter: updatedUser.agencyCenter,
        platformId: updatedUser.platformId,
        superLevel: updatedUser.superLevel,
        workedApp: updatedUser.workedApp,
        workedAppId: updatedUser.workedAppId,
        experienceLevel: updatedUser.experienceLevel,
      },
    });
  } catch (error) {
    console.error('Review verification error:', error);
    res.status(500).json({ error: 'Failed to review verification submission.' });
  }
});

// 3. User Management (Agents & Platform Creators)
router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roleParam = typeof req.query.role === 'string' ? req.query.role : undefined;

    const where: any = {};
    if (roleParam && ['AGENT', 'PLATFORM_CREATOR', 'ADMIN'].includes(roleParam)) {
      where.role = roleParam;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        bio: true,
        verificationStatus: true,
        agencyCenter: true,
        platformId: true,
        superLevel: true,
        workedApp: true,
        workedAppId: true,
        experienceLevel: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            subscriptions: true,
            followers: true,
            following: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// 4. Promotional Posts Moderation
router.get('/posts', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const posts = await prisma.post.findMany({
      include: {
        creator: {
          select: { id: true, fullName: true, email: true },
        },
        boosts: {
          where: { status: 'ACTIVE', expirationTime: { gt: now } },
          take: 1,
        },
        _count: {
          select: { likes: true, views: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      posts: posts.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        platformName: p.platformName,
        destinationLink: p.destinationLink,
        imageUrl: p.imageUrl ? `/uploads/posts/${p.imageUrl}` : null,
        isPublished: p.isPublished,
        creator: p.creator,
        likeCount: p.likeCount,
        viewCount: p.viewCount,
        isBoosted: p.boosts.length > 0,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Admin fetch posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts for moderation.' });
  }
});

// Toggle Post Visibility / Publish Status
router.put('/posts/:id/toggle', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }

    const updated = await prisma.post.update({
      where: { id },
      data: { isPublished: !post.isPublished },
    });

    res.json({
      message: `Post visibility updated to ${updated.isPublished ? 'published' : 'hidden'}.`,
      post: updated,
    });
  } catch (error) {
    console.error('Toggle post visibility error:', error);
    res.status(500).json({ error: 'Failed to update post status.' });
  }
});

// Delete Post
router.delete('/posts/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await prisma.post.delete({ where: { id } });
    res.json({ message: 'Post removed by administrator.' });
  } catch (error) {
    console.error('Admin delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

// 5. Subscription & Payment Tracking
router.get('/subscriptions', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ subscriptions });
  } catch (error) {
    console.error('Admin fetch subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions.' });
  }
});

router.get('/payments', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await prisma.payments.findMany({
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ payments });
  } catch (error) {
    console.error('Admin fetch payments error:', error);
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// 6. View & Manage Boosted Posts
router.get('/boosts', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const boosts = await prisma.postBoost.findMany({
      include: {
        post: {
          include: {
            creator: {
              select: { id: true, fullName: true, email: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ boosts });
  } catch (error) {
    console.error('Admin fetch boosts error:', error);
    res.status(500).json({ error: 'Failed to fetch boosts.' });
  }
});

// 7. Contact Admin Tickets Management
router.get('/tickets', async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tickets = await prisma.contactAdminTicket.findMany({
      include: {
        user: {
          select: { id: true, fullName: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Admin fetch tickets error:', error);
    res.status(500).json({ error: 'Failed to fetch tickets.' });
  }
});

// Reply and Resolve Contact Ticket
router.post('/tickets/:id/reply', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { adminReply } = req.body;

    if (!adminReply || !adminReply.trim()) {
      res.status(400).json({ error: 'Reply content cannot be empty.' });
      return;
    }

    const ticket = await prisma.contactAdminTicket.update({
      where: { id },
      data: {
        adminReply: adminReply.trim(),
        status: 'RESOLVED',
        repliedAt: new Date(),
      },
    });

    res.json({ message: 'Ticket responded to and resolved.', ticket });
  } catch (error) {
    console.error('Reply ticket error:', error);
    res.status(500).json({ error: 'Failed to reply to ticket.' });
  }
});

export default router;
