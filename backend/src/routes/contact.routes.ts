import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { validateObjectFields } from '../utils/prohibitedPatterns';

const router = Router();

// Submit Inquiry / Ticket to Admin (Agents or Platform Creators)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400).json({ error: 'Subject and message are required.' });
      return;
    }

    // Prohibited content check
    const validation = validateObjectFields({ subject, message }, ['subject', 'message']);
    if (!validation.isValid) {
      res.status(400).json({ error: validation.errorMessage });
      return;
    }

    const ticket = await prisma.contactAdminTicket.create({
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
  } catch (error) {
    console.error('Contact admin error:', error);
    res.status(500).json({ error: 'Failed to submit contact request.' });
  }
});

// Get user's own submitted tickets & responses
router.get('/my-tickets', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const tickets = await prisma.contactAdminTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ tickets });
  } catch (error) {
    console.error('Fetch user tickets error:', error);
    res.status(500).json({ error: 'Failed to retrieve inquiries.' });
  }
});

export default router;
