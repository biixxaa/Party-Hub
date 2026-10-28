"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Submit Identity Verification with Platform ID, Agency Center, Worked App & ID
router.post('/submit', auth_1.authenticateToken, upload_1.uploadVerification.single('screenshot'), async (req, res) => {
    try {
        const userId = req.user.id;
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
        const currentUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { verificationStatus: true },
        });
        if (currentUser?.verificationStatus === 'APPROVED') {
            if (req.file)
                fs_1.default.unlinkSync(req.file.path);
            res.status(400).json({ error: 'Your identity verification is already approved.' });
            return;
        }
        const effectivePlatformId = (platformId && platformId.trim()) ? platformId.trim() : workedAppId.trim();
        const screenshotFilename = req.file ? req.file.filename : null;
        // Create submission and update user status to PENDING
        const [submission] = await prisma_1.default.$transaction([
            prisma_1.default.verificationSubmission.create({
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
            prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error('Submit verification error:', error);
        res.status(500).json({ error: 'Failed to submit identity verification.' });
    }
});
// Get User's Verification Status & Submissions
router.get('/status', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
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
    }
    catch (error) {
        console.error('Fetch verification status error:', error);
        res.status(500).json({ error: 'Failed to fetch verification status.' });
    }
});
// Secure image stream for verification screenshot
// SECURE: Accessible ONLY to the user who uploaded it or an ADMIN!
router.get('/image/:submissionId', auth_1.authenticateToken, async (req, res) => {
    try {
        const submissionId = req.params.submissionId;
        const currentUserId = req.user.id;
        const currentUserRole = req.user.role;
        const submission = await prisma_1.default.verificationSubmission.findUnique({
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
        const filePath = path_1.default.join(upload_1.verificationsDir, submission.screenshotPath);
        if (!fs_1.default.existsSync(filePath)) {
            res.status(404).json({ error: 'Screenshot file not found on server.' });
            return;
        }
        // Set caching headers & serve
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Get verification image error:', error);
        res.status(500).json({ error: 'Failed to retrieve verification image.' });
    }
});
exports.default = router;
