import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateObjectFields } from '../utils/prohibitedPatterns';
import { Role } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'partyhub-jwt-secret-key-production-grade-2026-secure';

// Helper to generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName, role, bio, platformId, agencyCenter, superLevel } = req.body;

    if (!email || !password || !fullName || !role) {
      res.status(400).json({ error: 'Email, password, full name, and role are required.' });
      return;
    }

    if (!['AGENT', 'PLATFORM_CREATOR'].includes(role)) {
      res.status(400).json({ error: 'Role must be either AGENT or PLATFORM_CREATOR.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    // Prohibited contact information validation (Section 7)
    const validation = validateObjectFields({ fullName, bio }, ['fullName', 'bio']);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage });
      return;
    }

    // Check existing user
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const isCreator = role === 'PLATFORM_CREATOR';

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        fullName: fullName.trim(),
        role: role as Role,
        bio: bio ? bio.trim() : null,
        platformId: !isCreator && platformId ? platformId.trim() : null,
        agencyCenter: !isCreator && agencyCenter ? agencyCenter.trim() : null,
        superLevel: !isCreator && superLevel ? superLevel.trim() : null,
        // Platform Creators are automatically approved upon registration (no ID or admin verification needed)
        verificationStatus: isCreator ? 'APPROVED' : 'UNSUBMITTED',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
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
      }
    });

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(user.id);

    // Fetch active subscriptions
    const now = new Date();
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: user.id,
        status: 'ACTIVE',
        expirationDate: { gt: now }
      }
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        verificationStatus: user.verificationStatus,
        agencyCenter: user.agencyCenter,
        platformId: user.platformId,
        superLevel: user.superLevel,
        workedApp: user.workedApp,
        workedAppId: user.workedAppId,
        experienceLevel: user.experienceLevel,
        createdAt: user.createdAt,
        activeSubscriptions,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get Current Authenticated User with Subscriptions and Verification info
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
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
        subscriptions: {
          where: {
            status: 'ACTIVE',
            expirationDate: { gt: now }
          },
          orderBy: { expirationDate: 'desc' },
        },
        verifications: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        ...user,
        activeSubscriptions: user.subscriptions,
        latestVerification: user.verifications[0] || null,
      }
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Server error retrieving user data.' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, bio } = req.body;

    const validation = validateObjectFields({ fullName, bio }, ['fullName', 'bio']);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(fullName ? { fullName: fullName.trim() } : {}),
        bio: bio !== undefined ? (bio ? bio.trim() : null) : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        bio: true,
        verificationStatus: true,
      }
    });

    res.json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default router;
