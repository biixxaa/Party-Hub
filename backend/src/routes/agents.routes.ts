import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';

const router = Router();

// 1. List Agents
router.get('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    const agents = await prisma.user.findMany({
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
  } catch (error) {
    console.error('Fetch agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents.' });
  }
});

// 2. View Agent Profile by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const currentUserId = req.user!.id;

    const agent = await prisma.user.findUnique({
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
  } catch (error) {
    console.error('Fetch agent profile error:', error);
    res.status(500).json({ error: 'Failed to fetch agent profile.' });
  }
});

// 3. Follow / Unfollow Agent
// Requires: AGENT role
router.post(
  '/:id/follow',
  authenticateToken,
  requireRole(['AGENT']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const followerId = req.user!.id;
      const followingId = req.params.id as string;

      if (followerId === followingId) {
        res.status(400).json({ error: 'You cannot follow yourself.' });
        return;
      }

      const targetAgent = await prisma.user.findUnique({
        where: { id: followingId },
      });

      if (!targetAgent || targetAgent.role !== 'AGENT') {
        res.status(404).json({ error: 'Target agent not found.' });
        return;
      }

      // Check existing follow
      const existing = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId,
          },
        },
      });

      if (existing) {
        // Unfollow
        await prisma.follow.delete({
          where: { id: existing.id },
        });

        res.json({ isFollowing: false, message: `Unfollowed ${targetAgent.fullName}.` });
      } else {
        // Follow
        await prisma.follow.create({
          data: {
            followerId,
            followingId,
          },
        });

        res.json({ isFollowing: true, message: `Now following ${targetAgent.fullName}.` });
      }
    } catch (error) {
      console.error('Follow agent error:', error);
      res.status(500).json({ error: 'Failed to update follow status.' });
    }
  }
);

export default router;
