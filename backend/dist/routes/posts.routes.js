"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const verificationGuard_1 = require("../middleware/verificationGuard");
const subscriptionGuard_1 = require("../middleware/subscriptionGuard");
const upload_1 = require("../middleware/upload");
const prohibitedPatterns_1 = require("../utils/prohibitedPatterns");
const router = (0, express_1.Router)();
// Helper to auto-expire boosts older than 24 hours
async function checkAndExpireBoosts() {
    const now = new Date();
    await prisma_1.default.postBoost.updateMany({
        where: {
            status: 'ACTIVE',
            expirationTime: { lte: now },
        },
        data: { status: 'EXPIRED' },
    });
}
// 1. Promotional Feed (Accessible by authenticated users)
router.get('/feed', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Check & expire boosts first
        await checkAndExpireBoosts();
        const now = new Date();
        // Fetch posts: Active boosted posts first, then latest created posts
        const posts = await prisma_1.default.post.findMany({
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
            if (a.isBoosted && !b.isBoosted)
                return -1;
            if (!a.isBoosted && b.isBoosted)
                return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        res.json({ posts: formatted });
    }
    catch (error) {
        console.error('Fetch feed error:', error);
        res.status(500).json({ error: 'Failed to fetch promotional feed.' });
    }
});
// 2. Record Post View / Impression
router.post('/:id/view', auth_1.authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user?.id;
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }
        // Increment post view count and log view
        await prisma_1.default.$transaction([
            prisma_1.default.postView.create({
                data: {
                    postId,
                    userId,
                    ipAddress: ip,
                },
            }),
            prisma_1.default.post.update({
                where: { id: postId },
                data: { viewCount: { increment: 1 } },
            }),
        ]);
        res.json({ success: true });
    }
    catch (error) {
        console.error('Record post view error:', error);
        res.status(500).json({ error: 'Failed to record impression.' });
    }
});
// 3. Like / Unlike Post (Agents Only)
router.post('/:id/like', auth_1.authenticateToken, (0, roleGuard_1.requireRole)(['AGENT']), async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const post = await prisma_1.default.post.findUnique({ where: { id: postId } });
        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }
        // Check if already liked
        const existingLike = await prisma_1.default.postLike.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId,
                },
            },
        });
        if (existingLike) {
            // Unlike post
            await prisma_1.default.$transaction([
                prisma_1.default.postLike.delete({
                    where: { id: existingLike.id },
                }),
                prisma_1.default.post.update({
                    where: { id: postId },
                    data: { likeCount: { decrement: 1 } },
                }),
            ]);
            res.json({ liked: false, message: 'Post unliked successfully.' });
        }
        else {
            // Like post
            await prisma_1.default.$transaction([
                prisma_1.default.postLike.create({
                    data: { postId, userId },
                }),
                prisma_1.default.post.update({
                    where: { id: postId },
                    data: { likeCount: { increment: 1 } },
                }),
            ]);
            res.json({ liked: true, message: 'Post liked successfully.' });
        }
    }
    catch (error) {
        console.error('Like post error:', error);
        res.status(500).json({ error: 'Failed to update like status.' });
    }
});
// 4. View who liked a post (Platform Creator or Admin)
router.get('/:id/likes', auth_1.authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const post = await prisma_1.default.post.findUnique({
            where: { id: postId },
            select: { creatorId: true },
        });
        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }
        // Only post creator or Admin can view the list of Agents who liked
        if (post.creatorId !== req.user.id && req.user.role !== 'ADMIN') {
            res.status(403).json({ error: 'Only the post creator or an Admin can view the list of likers.' });
            return;
        }
        const likes = await prisma_1.default.postLike.findMany({
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
    }
    catch (error) {
        console.error('Fetch post likers error:', error);
        res.status(500).json({ error: 'Failed to fetch post likers.' });
    }
});
// 5. Creator: View and Manage Own Promotional Posts with stats & likers
router.get('/my-posts', auth_1.authenticateToken, (0, roleGuard_1.requireRole)(['PLATFORM_CREATOR']), verificationGuard_1.requireApprovedVerification, (0, subscriptionGuard_1.requireActiveSubscription)('CREATOR_PREMIUM'), async (req, res) => {
    try {
        const creatorId = req.user.id;
        const now = new Date();
        await checkAndExpireBoosts();
        const posts = await prisma_1.default.post.findMany({
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
    }
    catch (error) {
        console.error('Fetch my-posts error:', error);
        res.status(500).json({ error: 'Failed to fetch posts.' });
    }
});
// 6. Creator: Create New Promotional Post
router.post('/', auth_1.authenticateToken, (0, roleGuard_1.requireRole)(['PLATFORM_CREATOR']), verificationGuard_1.requireApprovedVerification, (0, subscriptionGuard_1.requireActiveSubscription)('CREATOR_PREMIUM'), upload_1.uploadPostImage.single('image'), async (req, res) => {
    try {
        const creatorId = req.user.id;
        const { title, description, platformName, destinationLink } = req.body;
        if (!title || !description || !platformName || !destinationLink) {
            res.status(400).json({ error: 'Title, description, platform name, and destination link are all required.' });
            return;
        }
        // Prohibited Contact Info Validation (Section 7)
        const validation = (0, prohibitedPatterns_1.validateObjectFields)({ title, description, platformName, destinationLink }, ['title', 'description', 'platformName', 'destinationLink']);
        if (!validation.isValid) {
            res.status(400).json({ error: validation.errorMessage });
            return;
        }
        const imageUrl = req.file ? req.file.filename : null;
        const post = await prisma_1.default.post.create({
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
    }
    catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ error: 'Failed to create promotional post.' });
    }
});
// 7. Creator / Admin: Edit Promotional Post
router.put('/:id', auth_1.authenticateToken, upload_1.uploadPostImage.single('image'), async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        const existingPost = await prisma_1.default.post.findUnique({ where: { id: postId } });
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
        const validation = (0, prohibitedPatterns_1.validateObjectFields)({ title, description, platformName, destinationLink }, ['title', 'description', 'platformName', 'destinationLink']);
        if (!validation.isValid) {
            res.status(400).json({ error: validation.errorMessage });
            return;
        }
        const updated = await prisma_1.default.post.update({
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
    }
    catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ error: 'Failed to update post.' });
    }
});
// 8. Creator / Admin: Delete Promotional Post
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.id;
        const userRole = req.user.role;
        const existingPost = await prisma_1.default.post.findUnique({ where: { id: postId } });
        if (!existingPost) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }
        if (existingPost.creatorId !== userId && userRole !== 'ADMIN') {
            res.status(403).json({ error: 'Unauthorized to delete this post.' });
            return;
        }
        await prisma_1.default.post.delete({ where: { id: postId } });
        res.json({ message: 'Post deleted successfully.' });
    }
    catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post.' });
    }
});
exports.default = router;
