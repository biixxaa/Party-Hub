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
// 1. List Agents
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const agents = await prisma_1.default.user.findMany({
            where: {
                role: 'AGENT',
            },
            select: {
                id: true,
                fullName: true,
                bio: true,
                verificationStatus: true,
                agencyCenter: true,
                platformId: true,
                superLevel: true,
                workedApp: true,
                workedAppId: true,
                experienceLevel: true,
                createdAt: true,
                followers: {
                    select: { followerId: true },
                },
                following: {
                    select: { followingId: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const formatted = agents.map(agent => ({
            id: agent.id,
            fullName: agent.fullName,
            bio: agent.bio,
            verificationStatus: agent.verificationStatus,
            agencyCenter: agent.agencyCenter,
            platformId: agent.platformId,
            superLevel: agent.superLevel,
            workedApp: agent.workedApp,
            workedAppId: agent.workedAppId,
            experienceLevel: agent.experienceLevel,
            createdAt: agent.createdAt,
            followersCount: agent.followers.length,
            followingCount: agent.following.length,
            isFollowing: agent.followers.some(f => f.followerId === currentUserId),
            isSelf: agent.id === currentUserId,
        }));
        res.json({ agents: formatted });
    }
    catch (error) {
        console.error('Fetch agents error:', error);
        res.status(500).json({ error: 'Failed to fetch agents.' });
    }
});
// 2. View Agent Profile by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const id = req.params.id;
        const currentUserId = req.user.id;
        const agent = await prisma_1.default.user.findUnique({
            where: { id },
            include: {
                followers: {
                    include: {
                        follower: {
                            select: { id: true, fullName: true },
                        },
                    },
                },
                following: {
                    include: {
                        following: {
                            select: { id: true, fullName: true },
                        },
                    },
                },
            },
        });
        if (!agent || agent.role !== 'AGENT') {
            res.status(404).json({ error: 'Agent profile not found.' });
            return;
        }
        const isFollowing = agent.followers.some(f => f.followerId === currentUserId);
        res.json({
            agent: {
                id: agent.id,
                fullName: agent.fullName,
                email: agent.email,
                bio: agent.bio,
                verificationStatus: agent.verificationStatus,
                agencyCenter: agent.agencyCenter,
                platformId: agent.platformId,
                superLevel: agent.superLevel,
                workedApp: agent.workedApp,
                workedAppId: agent.workedAppId,
                experienceLevel: agent.experienceLevel,
                createdAt: agent.createdAt,
                followersCount: agent.followers.length,
                followingCount: agent.following.length,
                isFollowing,
                isSelf: agent.id === currentUserId,
            },
        });
    }
    catch (error) {
        console.error('Fetch agent profile error:', error);
        res.status(500).json({ error: 'Failed to fetch agent profile.' });
    }
});
// 3. Follow / Unfollow Agent
// Requires: AGENT role
router.post('/:id/follow', auth_1.authenticateToken, (0, roleGuard_1.requireRole)(['AGENT']), async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = req.params.id;
        if (followerId === followingId) {
            res.status(400).json({ error: 'You cannot follow yourself.' });
            return;
        }
        const targetAgent = await prisma_1.default.user.findUnique({
            where: { id: followingId },
        });
        if (!targetAgent || targetAgent.role !== 'AGENT') {
            res.status(404).json({ error: 'Target agent not found.' });
            return;
        }
        // Check existing follow
        const existing = await prisma_1.default.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId,
                    followingId,
                },
            },
        });
        if (existing) {
            // Unfollow
            await prisma_1.default.follow.delete({
                where: { id: existing.id },
            });
            res.json({ isFollowing: false, message: `Unfollowed ${targetAgent.fullName}.` });
        }
        else {
            // Follow
            await prisma_1.default.follow.create({
                data: {
                    followerId,
                    followingId,
                },
            });
            res.json({ isFollowing: true, message: `Now following ${targetAgent.fullName}.` });
        }
    }
    catch (error) {
        console.error('Follow agent error:', error);
        res.status(500).json({ error: 'Failed to update follow status.' });
    }
});
exports.default = router;
