"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const prohibitedPatterns_1 = require("../utils/prohibitedPatterns");
const router = (0, express_1.Router)();
// Submit Inquiry / Ticket to Admin (Agents or Platform Creators)
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { subject, message } = req.body;
        if (!subject || !message) {
            res.status(400).json({ error: 'Subject and message are required.' });
            return;
        }
        // Prohibited content check
        const validation = (0, prohibitedPatterns_1.validateObjectFields)({ subject, message }, ['subject', 'message']);
        if (!validation.isValid) {
            res.status(400).json({ error: validation.errorMessage });
            return;
        }
        const ticket = await prisma_1.default.contactAdminTicket.create({
            data: {
                userId,
                subject: subject.trim(),
                message: message.trim(),
                status: 'OPEN',
            },
        });
        res.status(201).json({
            message: 'Your message has been sent to the Admin team. We will respond shortly.',
            ticket,
        });
    }
    catch (error) {
        console.error('Contact admin error:', error);
        res.status(500).json({ error: 'Failed to submit contact request.' });
    }
});
// Get user's own submitted tickets & responses
router.get('/my-tickets', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const tickets = await prisma_1.default.contactAdminTicket.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ tickets });
    }
    catch (error) {
        console.error('Fetch user tickets error:', error);
        res.status(500).json({ error: 'Failed to retrieve inquiries.' });
    }
});
exports.default = router;
