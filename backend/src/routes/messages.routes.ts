import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { requireApprovedVerification } from '../middleware/verificationGuard';
import { requireActiveSubscription } from '../middleware/subscriptionGuard';
import { validateNoProhibitedContact } from '../utils/prohibitedPatterns';

const router = Router();

// Private Messaging is exclusively for verified Agents with an active Agent Premium subscription!
router.use(authenticateToken);
router.use(requireRole(['AGENT']));
router.use(requireApprovedVerification);
router.use(requireActiveSubscription('AGENT_PREMIUM'));

// 1. Get All Conversations for current Agent
router.get('/conversations', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    // Fetch all messages where current user is sender or receiver
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      include: {
        sender: {
          select: { id: true, fullName: true, email: true },
        },
        receiver: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by other user
    const conversationMap = new Map<string, {
      otherUser: { id: string; fullName: string; email: string };
      lastMessage: string;
      lastMessageAt: Date;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const otherUser = msg.senderId === currentUserId ? msg.receiver : msg.sender;
      if (!conversationMap.has(otherUser.id)) {
        conversationMap.set(otherUser.id, {
          otherUser,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
        });
      }

      if (msg.receiverId === currentUserId && !msg.isRead) {
        const conv = conversationMap.get(otherUser.id)!;
        conv.unreadCount += 1;
      }
    }

    res.json({ conversations: Array.from(conversationMap.values()) });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
});

// 2. Get Messages between Current Agent and Another Agent
router.get('/:otherUserId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = req.params.otherUserId as string;

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, fullName: true, email: true, role: true },
    });

    if (!otherUser || otherUser.role !== 'AGENT') {
      res.status(404).json({ error: 'Agent not found.' });
      return;
    }

    // Mark unread messages sent by otherUser to current user as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: currentUserId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      otherUser,
      messages: messages.map(m => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        isRead: m.isRead,
        isSelf: m.senderId === currentUserId,
        createdAt: m.createdAt,
      })),
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// 3. Send Private Message to Another Agent
router.post('/:otherUserId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;
    const otherUserId = req.params.otherUserId as string;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Message content cannot be empty.' });
      return;
    }

    if (currentUserId === otherUserId) {
      res.status(400).json({ error: 'You cannot message yourself.' });
      return;
    }

    // Verify other user exists and is an AGENT
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true, role: true },
    });

    if (!otherUser || otherUser.role !== 'AGENT') {
      res.status(404).json({ error: 'Recipient agent not found.' });
      return;
    }

    // Section 7: Prohibited Content Validation
    // WhatsApp numbers/links, Telegram usernames/links strictly prohibited!
    const validation = validateNoProhibitedContact(content);
    if (!validation.isValid) {
      res.status(400).json({
        error: validation.errorMessage,
        code: 'PROHIBITED_CONTACT_INFO',
        detail: 'External WhatsApp or Telegram contact information is prohibited to maintain safety and compliance.'
      });
      return;
    }

    const message = await prisma.message.create({
      data: {
        senderId: currentUserId,
        receiverId: otherUserId,
        content: content.trim(),
      },
    });

    res.status(201).json({
      message: 'Message sent successfully.',
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

export default router;
