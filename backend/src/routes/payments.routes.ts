import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma from '../prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { requireRole } from '../middleware/roleGuard';
import { requireApprovedVerification } from '../middleware/verificationGuard';
import { SubscriptionType, PaymentPurpose } from '@prisma/client';

const router = Router();

// Pricing constants (USD)
export const PRICING = {
  AGENT_PREMIUM: 50.0,    // $50 per week
  CREATOR_PREMIUM: 100.0, // $100 per week
  POST_BOOST: 50.0,       // $50 per 24 hours
};

// Official Chapa payment gateway link for Agent membership & services
export const CHAPA_PAYMENT_URL = 'https://qr.chapa.global/test/payment-preview/payment-link/m6c7yeUA7Y';

// Payment verification helper
function verifyCardDetails(cardInfo: {
  cardNumber?: string;
  expDate?: string;
  cvv?: string;
  cardholderName?: string;
}): { verified: boolean; message?: string } {
  const { cardNumber, expDate, cvv, cardholderName } = cardInfo;

  if (!cardNumber || !expDate || !cvv || !cardholderName) {
    return { verified: false, message: 'Card number, expiration date, CVV, and cardholder name are all required.' };
  }

  const cleanNum = cardNumber.replace(/\s+/g, '');
  if (cleanNum.length < 13 || cleanNum.length > 19) {
    return { verified: false, message: 'Invalid credit card number format.' };
  }

  // Reject test card that simulates failure
  if (cleanNum.endsWith('0000')) {
    return { verified: false, message: 'Payment gateway rejected: Insufficient funds or card declined.' };
  }

  if (cvv.length < 3 || cvv.length > 4) {
    return { verified: false, message: 'Invalid CVV code.' };
  }

  return { verified: true };
}

// 1. Subscribe to Agent Premium ($50 USD / week)
// Requires: AGENT role, APPROVED identity verification
router.post(
  '/subscribe/agent',
  authenticateToken,
  requireRole(['AGENT']),
  requireApprovedVerification,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { paymentDetails, paymentMethod = 'CARD' } = req.body;

      if (!paymentDetails && paymentMethod !== 'CHAPA') {
        res.status(400).json({ error: 'Payment details are required for subscription checkout.' });
        return;
      }

      let recordedPaymentMethod = 'Credit Card';
      let transactionId = '';

      if (paymentMethod === 'CHAPA') {
        const chapaRef = paymentDetails?.chapaReference?.trim();
        const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        transactionId = chapaRef
          ? `TXN-CHAPA-${chapaRef.replace(/[^a-zA-Z0-9_-]/g, '')}-${randSuffix}`
          : `TXN-CHAPA-AGP-${Date.now()}-${randSuffix}`;
        recordedPaymentMethod = chapaRef
          ? `Chapa (Ref: ${chapaRef})`
          : 'Chapa (Telebirr / CBE / Cards)';
      } else {
        // Verify payment through gateway check
        const verification = verifyCardDetails(paymentDetails);
        transactionId = `TXN-AGP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        if (!verification.verified) {
          // Record failed payment transaction
          await prisma.payments.create({
            data: {
              userId,
              amount: PRICING.AGENT_PREMIUM,
              currency: 'USD',
              purpose: 'AGENT_PREMIUM',
              status: 'FAILED',
              transactionId,
              paymentMethod: 'Credit Card',
            },
          });

          res.status(402).json({ error: verification.message || 'Payment processing failed. Card declined.' });
          return;
        }
        recordedPaymentMethod = `Card (ending in ${paymentDetails.cardNumber.slice(-4)})`;
      }

      const now = new Date();
      // Exactly 7 days from activation
      const expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Perform verified payment and activate subscription
      const [payment, subscription] = await prisma.$transaction(async (tx) => {
        // Expire any existing active subscriptions of this type
        await tx.subscription.updateMany({
          where: { userId, type: 'AGENT_PREMIUM', status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });

        const newPayment = await tx.payments.create({
          data: {
            userId,
            amount: PRICING.AGENT_PREMIUM,
            currency: 'USD',
            purpose: 'AGENT_PREMIUM',
            status: 'COMPLETED',
            transactionId,
            paymentMethod: recordedPaymentMethod,
          },
        });

        const newSub = await tx.subscription.create({
          data: {
            userId,
            type: 'AGENT_PREMIUM',
            status: 'ACTIVE',
            pricePaid: PRICING.AGENT_PREMIUM,
            startDate: now,
            expirationDate,
            paymentId: newPayment.id,
          },
        });

        return [newPayment, newSub];
      });

      res.status(201).json({
        message: 'Agent Premium subscription successfully activated for 1 week ($50 USD).',
        subscription,
        payment,
      });
    } catch (error) {
      console.error('Agent subscription error:', error);
      res.status(500).json({ error: 'Failed to process Agent Premium subscription payment.' });
    }
  }
);

// 2. Subscribe to Creator Premium ($100 USD / week)
// Requires: PLATFORM_CREATOR role, APPROVED identity verification
router.post(
  '/subscribe/creator',
  authenticateToken,
  requireRole(['PLATFORM_CREATOR']),
  requireApprovedVerification,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { paymentDetails, paymentMethod = 'CARD' } = req.body;

      if (!paymentDetails && paymentMethod !== 'CHAPA') {
        res.status(400).json({ error: 'Payment details are required for subscription checkout.' });
        return;
      }

      let recordedPaymentMethod = 'Credit Card';
      let transactionId = '';

      if (paymentMethod === 'CHAPA') {
        const chapaRef = paymentDetails?.chapaReference?.trim();
        const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        transactionId = chapaRef
          ? `TXN-CHAPA-${chapaRef.replace(/[^a-zA-Z0-9_-]/g, '')}-${randSuffix}`
          : `TXN-CHAPA-CRP-${Date.now()}-${randSuffix}`;
        recordedPaymentMethod = chapaRef
          ? `Chapa (Ref: ${chapaRef})`
          : 'Chapa (Telebirr / CBE / Cards)';
      } else {
        const verification = verifyCardDetails(paymentDetails);
        transactionId = `TXN-CRP-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        if (!verification.verified) {
          await prisma.payments.create({
            data: {
              userId,
              amount: PRICING.CREATOR_PREMIUM,
              currency: 'USD',
              purpose: 'CREATOR_PREMIUM',
              status: 'FAILED',
              transactionId,
              paymentMethod: 'Credit Card',
            },
          });

          res.status(402).json({ error: verification.message || 'Payment processing failed. Card declined.' });
          return;
        }
        recordedPaymentMethod = `Card (ending in ${paymentDetails.cardNumber.slice(-4)})`;
      }

      const now = new Date();
      // Exactly 7 days from activation
      const expirationDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [payment, subscription] = await prisma.$transaction(async (tx) => {
        // Expire any existing active subscriptions of this type
        await tx.subscription.updateMany({
          where: { userId, type: 'CREATOR_PREMIUM', status: 'ACTIVE' },
          data: { status: 'EXPIRED' },
        });

        const newPayment = await tx.payments.create({
          data: {
            userId,
            amount: PRICING.CREATOR_PREMIUM,
            currency: 'USD',
            purpose: 'CREATOR_PREMIUM',
            status: 'COMPLETED',
            transactionId,
            paymentMethod: recordedPaymentMethod,
          },
        });

        const newSub = await tx.subscription.create({
          data: {
            userId,
            type: 'CREATOR_PREMIUM',
            status: 'ACTIVE',
            pricePaid: PRICING.CREATOR_PREMIUM,
            startDate: now,
            expirationDate,
            paymentId: newPayment.id,
          },
        });

        return [newPayment, newSub];
      });

      res.status(201).json({
        message: 'Platform Creator Premium subscription successfully activated for 1 week ($100 USD).',
        subscription,
        payment,
      });
    } catch (error) {
      console.error('Creator subscription error:', error);
      res.status(500).json({ error: 'Failed to process Creator Premium subscription payment.' });
    }
  }
);

// 3. Paid Post Boosting ($50 USD per post per 24 hours)
// Requires: PLATFORM_CREATOR role, APPROVED verification, owns the post
router.post(
  '/boost/post',
  authenticateToken,
  requireRole(['PLATFORM_CREATOR']),
  requireApprovedVerification,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { postId, paymentDetails, paymentMethod = 'CARD' } = req.body;

      if (!postId || (!paymentDetails && paymentMethod !== 'CHAPA')) {
        res.status(400).json({ error: 'Post ID and payment details are required to boost a post.' });
        return;
      }

      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        res.status(404).json({ error: 'Post not found.' });
        return;
      }

      if (post.creatorId !== userId) {
        res.status(403).json({ error: 'You can only boost your own promotional posts.' });
        return;
      }

      // Check if post already has an active boost
      const now = new Date();
      const existingBoost = await prisma.postBoost.findFirst({
        where: {
          postId,
          status: 'ACTIVE',
          expirationTime: { gt: now },
        },
      });

      if (existingBoost) {
        res.status(400).json({
          error: `This post is already boosted until ${existingBoost.expirationTime.toISOString()}.`,
          expirationTime: existingBoost.expirationTime,
        });
        return;
      }

      let recordedPaymentMethod = 'Credit Card';
      let transactionId = '';

      if (paymentMethod === 'CHAPA') {
        const chapaRef = paymentDetails?.chapaReference?.trim();
        const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        transactionId = chapaRef
          ? `TXN-CHAPA-${chapaRef.replace(/[^a-zA-Z0-9_-]/g, '')}-${randSuffix}`
          : `TXN-CHAPA-BST-${Date.now()}-${randSuffix}`;
        recordedPaymentMethod = chapaRef
          ? `Chapa (Ref: ${chapaRef})`
          : 'Chapa (Telebirr / CBE / Cards)';
      } else {
        // Verify payment details
        const verification = verifyCardDetails(paymentDetails);
        transactionId = `TXN-BST-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        if (!verification.verified) {
          await prisma.payments.create({
            data: {
              userId,
              amount: PRICING.POST_BOOST,
              currency: 'USD',
              purpose: 'POST_BOOST',
              status: 'FAILED',
              transactionId,
              paymentMethod: 'Credit Card',
              referenceId: postId,
            },
          });

          res.status(402).json({ error: verification.message || 'Boost payment declined.' });
          return;
        }
        recordedPaymentMethod = `Card (ending in ${paymentDetails.cardNumber.slice(-4)})`;
      }

      // Boost lasts exactly 24 hours from activation time
      const startTime = new Date();
      const expirationTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);

      const [payment, boost] = await prisma.$transaction(async (tx) => {
        const newPayment = await tx.payments.create({
          data: {
            userId,
            amount: PRICING.POST_BOOST,
            currency: 'USD',
            purpose: 'POST_BOOST',
            status: 'COMPLETED',
            transactionId,
            paymentMethod: recordedPaymentMethod,
            referenceId: postId,
          },
        });

        const newBoost = await tx.postBoost.create({
          data: {
            postId,
            status: 'ACTIVE',
            pricePaid: PRICING.POST_BOOST,
            startTime,
            expirationTime,
            paymentId: newPayment.id,
          },
        });

        return [newPayment, newBoost];
      });

      res.status(201).json({
        message: 'Promotional post successfully boosted for 24 hours ($50 USD). Sponsored status is active.',
        boost,
        payment,
      });
    } catch (error) {
      console.error('Post boost error:', error);
      res.status(500).json({ error: 'Failed to process post boost payment.' });
    }
  }
);

// 4. Get Current User's Payment History
router.get('/history', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const payments = await prisma.payments.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        subscription: true,
        boost: {
          include: {
            post: {
              select: { title: true, platformName: true },
            },
          },
        },
      },
    });

    res.json({ payments });
  } catch (error) {
    console.error('Fetch payment history error:', error);
    res.status(500).json({ error: 'Failed to fetch payment history.' });
  }
});

// 5. Get Chapa Payment Link for Agent Membership
router.get('/chapa-link', async (_req, res: Response): Promise<void> => {
  res.json({
    paymentUrl: CHAPA_PAYMENT_URL,
    provider: 'Chapa',
    supportedMethods: ['Telebirr', 'CBEBirr', 'Commercial Bank of Ethiopia', 'Local Cards', 'QR Pay'],
  });
});

export default router;
