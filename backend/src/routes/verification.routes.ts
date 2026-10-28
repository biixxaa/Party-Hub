import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { uploadVerification, verificationsDir } from '../middleware/upload';

const router = Router();

// Submit Identity Verification with Platform ID, Agency Center, Worked App & ID
router.post(
  '/submit',
  authenticateToken,
  uploadVerification.single('screenshot'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { platformId, agencyCenter, superLevel, workedApp, workedAppId, pastExperience, notes } = req.body;

      if (!workedApp || !workedApp.trim()) {
        res.status(400).json({ error: 'Please mention which app you have worked on in the past (e.g. Bigo Live, Poppo, Chamet, TikTok Live, etc.).' });
        return;
      }

      if (!workedAppId || !workedAppId.trim()) {
        res.status(400).json({ error: 'Please provide your account/host ID on the app you have worked on.' });
        return;
      }

      if (!agencyCenter || !agencyCenter.trim()) {
        res.status(400).json({ error: 'Please specify your Agency Center to authenticate your representation.' });
        return;
      }

      // Check if user already has an approved verification
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { verificationStatus: true },
      });

      if (currentUser?.verificationStatus === 'APPROVED') {
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(400).json({ error: 'Your identity verification is already approved.' });
        return;
      }

      const effectivePlatformId = (platformId && platformId.trim()) ? platformId.trim() : workedAppId.trim();
      const screenshotFilename = req.file ? req.file.filename : null;

      // Create submission and update user status to PENDING
      const [submission] = await prisma.$transaction([
        prisma.verificationSubmission.create({
          data: {
            userId,
            screenshotPath: screenshotFilename,
            platformId: effectivePlatformId,
            agencyCenter: agencyCenter.trim(),
            superLevel: superLevel ? superLevel.trim() : 'Super Level 1',
            workedApp: workedApp.trim(),
            workedAppId: workedAppId.trim(),
            pastExperience: pastExperience ? pastExperience.trim() : null,
            notes: notes ? notes.trim() : null,
            status: 'PENDING',
          },
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            verificationStatus: 'PENDING',
            platformId: effectivePlatformId,
            agencyCenter: agencyCenter.trim(),
            superLevel: superLevel ? superLevel.trim() : 'Super Level 1',
            workedApp: workedApp.trim(),
            workedAppId: workedAppId.trim(),
          },
        }),
      ]);

      res.status(201).json({
        message: 'Verification request submitted. Admins will evaluate your past experience on ' + workedApp + ' (ID: ' + workedAppId + ') and assign your Level A/B/C/D rating.',
        submission,
        verificationStatus: 'PENDING',
      });
    } catch (error) {
      console.error('Submit verification error:', error);
      res.status(500).json({ error: 'Failed to submit identity verification.' });
    }
  }
);

// Get User's Verification Status & Submissions
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        verificationStatus: true,
        agencyCenter: true,
        platformId: true,
        superLevel: true,
        workedApp: true,
        workedAppId: true,
        experienceLevel: true,
        verifications: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      verificationStatus: user.verificationStatus,
      agencyCenter: user.agencyCenter,
      platformId: user.platformId,
      superLevel: user.superLevel,
      workedApp: user.workedApp,
      workedAppId: user.workedAppId,
      experienceLevel: user.experienceLevel,
      submissions: user.verifications,
      latestSubmission: user.verifications[0] || null,
    });
  } catch (error) {
    console.error('Fetch verification status error:', error);
    res.status(500).json({ error: 'Failed to fetch verification status.' });
  }
});

// Secure image stream for verification screenshot
// SECURE: Accessible ONLY to the user who uploaded it or an ADMIN!
router.get('/image/:submissionId', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submissionId = req.params.submissionId as string;
    const currentUserId = req.user!.id;
    const currentUserRole = req.user!.role;

    const submission = await prisma.verificationSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      res.status(404).json({ error: 'Verification submission not found.' });
      return;
    }

    // Authorization check
    if (submission.userId !== currentUserId && currentUserRole !== 'ADMIN') {
      res.status(403).json({ error: 'Unauthorized. You do not have permission to view this screenshot.' });
      return;
    }

    if (!submission.screenshotPath) {
      res.status(404).json({ error: 'No screenshot file was attached for this verification submission.' });
      return;
    }

    const filePath = path.join(verificationsDir, submission.screenshotPath);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Screenshot file not found on server.' });
      return;
    }

    // Set caching headers & serve
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Get verification image error:', error);
    res.status(500).json({ error: 'Failed to retrieve verification image.' });
  }
});

export default router;
