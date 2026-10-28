"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const roleGuard_1 = require("../middleware/roleGuard");
const router = (0, express_1.Router)();
// Protect ALL admin routes with server-side authorization
router.use(auth_1.authenticateToken);
router.use((0, roleGuard_1.requireRole)(['ADMIN']));
// 1. Overall Admin Statistics
router.get('/stats', async (_req, res) => {
    try {
        const [totalUsers, totalAgents, totalCreators, pendingVerifications, totalPosts, activeBoosts, openTickets, payments,] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.user.count({ where: { role: 'AGENT' } }),
            prisma_1.default.user.count({ where: { role: 'PLATFORM_CREATOR' } }),
            prisma_1.default.verificationSubmission.count({ where: { status: 'PENDING' } }),
            prisma_1.default.post.count(),
            prisma_1.default.postBoost.count({ where: { status: 'ACTIVE', expirationTime: { gt: new Date() } } }),
            prisma_1.default.contactAdminTicket.count({ where: { status: 'OPEN' } }),
            prisma_1.default.payments.findMany({ where: { status: 'COMPLETED' }, select: { amount: true } }),
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
    }
    catch (error) {
        console.error('Fetch admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch platform statistics.' });
    }
});
// 2. Identity Verification Submissions Management
router.get('/verifications', async (req, res) => {
    try {
        const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;
        const where = {};
        if (statusParam && ['PENDING', 'APPROVED', 'REJECTED'].includes(statusParam)) {
            where.status = statusParam;
        }
        const submissions = await prisma_1.default.verificationSubmission.findMany({
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
    }
    catch (error) {
        console.error('Fetch verifications error:', error);
        res.status(500).json({ error: 'Failed to fetch verification submissions.' });
    }
});
// Admin sends direct verification challenge / message to user's shared ID
router.post('/verifications/:id/message', async (req, res) => {
    try {
        const id = req.params.id;
        const { messageContent } = req.body;
        if (!messageContent || !messageContent.trim()) {
            res.status(400).json({ error: 'Message content cannot be empty.' });
            return;
        }
        const submission = await prisma_1.default.verificationSubmission.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!submission) {
            res.status(404).json({ error: 'Verification submission not found.' });
            return;
        }
        const updatedSub = await prisma_1.default.verificationSubmission.update({
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
    }
    catch (error) {
        console.error('Send verification message error:', error);
        res.status(500).json({ error: 'Failed to record direct verification message.' });
    }
});
// Review Identity Verification (Approve or Reject, assign Experience Level A/B/C/D & confirm Super Level)
router.post('/verifications/:id/review', async (req, res) => {
    try {
        const id = req.params.id;
        const { status, rejectionReason, superLevel, agencyCenter, platformId, experienceLevel, workedApp, workedAppId } = req.body;
        const adminEmail = req.user.email;
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            res.status(400).json({ error: 'Status must be either APPROVED or REJECTED.' });
            return;
        }
        const submission = await prisma_1.default.verificationSubmission.findUnique({
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
        const [updatedSub, updatedUser] = await prisma_1.default.$transaction([
            prisma_1.default.verificationSubmission.update({
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
            prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error('Review verification error:', error);
        res.status(500).json({ error: 'Failed to review verification submission.' });
    }
});
// 3. User Management (Agents & Platform Creators)
router.get('/users', async (req, res) => {
    try {
        const roleParam = typeof req.query.role === 'string' ? req.query.role : undefined;
        const where = {};
        if (roleParam && ['AGENT', 'PLATFORM_CREATOR', 'ADMIN'].includes(roleParam)) {
            where.role = roleParam;
        }
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});
// 4. Promotional Posts Moderation
router.get('/posts', async (_req, res) => {
    try {
        const now = new Date();
        const posts = await prisma_1.default.post.findMany({
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
    }
    catch (error) {
        console.error('Admin fetch posts error:', error);
        res.status(500).json({ error: 'Failed to fetch posts for moderation.' });
    }
});
// Toggle Post Visibility / Publish Status
router.put('/posts/:id/toggle', async (req, res) => {
    try {
        const id = req.params.id;
        const post = await prisma_1.default.post.findUnique({ where: { id } });
        if (!post) {
            res.status(404).json({ error: 'Post not found.' });
            return;
        }
        const updated = await prisma_1.default.post.update({
            where: { id },
            data: { isPublished: !post.isPublished },
        });
        res.json({
            message: `Post visibility updated to ${updated.isPublished ? 'published' : 'hidden'}.`,
            post: updated,
        });
    }
    catch (error) {
        console.error('Toggle post visibility error:', error);
        res.status(500).json({ error: 'Failed to update post status.' });
    }
});
// Delete Post
router.delete('/posts/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.default.post.delete({ where: { id } });
        res.json({ message: 'Post removed by administrator.' });
    }
    catch (error) {
        console.error('Admin delete post error:', error);
        res.status(500).json({ error: 'Failed to delete post.' });
    }
});
// 5. Subscription & Payment Tracking
router.get('/subscriptions', async (_req, res) => {
    try {
        const subscriptions = await prisma_1.default.subscription.findMany({
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, role: true },
                },
                payment: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ subscriptions });
    }
    catch (error) {
        console.error('Admin fetch subscriptions error:', error);
        res.status(500).json({ error: 'Failed to fetch subscriptions.' });
    }
});
router.get('/payments', async (_req, res) => {
    try {
        const payments = await prisma_1.default.payments.findMany({
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ payments });
    }
    catch (error) {
        console.error('Admin fetch payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments.' });
    }
});
// 6. View & Manage Boosted Posts
router.get('/boosts', async (_req, res) => {
    try {
        const boosts = await prisma_1.default.postBoost.findMany({
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
    }
    catch (error) {
        console.error('Admin fetch boosts error:', error);
        res.status(500).json({ error: 'Failed to fetch boosts.' });
    }
});
// 7. Contact Admin Tickets Management
router.get('/tickets', async (_req, res) => {
    try {
        const tickets = await prisma_1.default.contactAdminTicket.findMany({
            include: {
                user: {
                    select: { id: true, fullName: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ tickets });
    }
    catch (error) {
        console.error('Admin fetch tickets error:', error);
        res.status(500).json({ error: 'Failed to fetch tickets.' });
    }
});
// Reply and Resolve Contact Ticket
router.post('/tickets/:id/reply', async (req, res) => {
    try {
        const id = req.params.id;
        const { adminReply } = req.body;
        if (!adminReply || !adminReply.trim()) {
            res.status(400).json({ error: 'Reply content cannot be empty.' });
            return;
        }
        const ticket = await prisma_1.default.contactAdminTicket.update({
            where: { id },
            data: {
                adminReply: adminReply.trim(),
                status: 'RESOLVED',
                repliedAt: new Date(),
            },
        });
        res.json({ message: 'Ticket responded to and resolved.', ticket });
    }
    catch (error) {
        console.error('Reply ticket error:', error);
        res.status(500).json({ error: 'Failed to reply to ticket.' });
    }
});
exports.default = router;
