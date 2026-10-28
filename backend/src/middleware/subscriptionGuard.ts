import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import prisma from '../prisma';
import { SubscriptionType } from '@prisma/client';

/**
 * Checks if the user has an active, unexpired subscription of the given type.
 * Also automatically marks any expired active subscriptions as EXPIRED in the database.
 */
export async function checkActiveSubscription(userId: string, type: SubscriptionType): Promise<boolean> {
  const now = new Date();

  // Find active subscriptions
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      type,
      status: 'ACTIVE',
    },
    orderBy: { expirationDate: 'desc' },
  });

  if (!activeSub) {
    return false;
  }

  // Check if expired
  if (activeSub.expirationDate <= now) {
    // Update to EXPIRED in database
    await prisma.subscription.update({
      where: { id: activeSub.id },
      data: { status: 'EXPIRED' },
    });
    return false;
  }

  return true;
}

export const requireActiveSubscription = (type: SubscriptionType) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // Admins bypass subscription checks
    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    const hasActive = await checkActiveSubscription(req.user.id, type);

    if (!hasActive) {
      const typeLabel = type === 'AGENT_PREMIUM' ? 'Agent Premium ($50/week)' : 'Creator Premium ($100/week)';
      res.status(403).json({
        error: `Active ${typeLabel} subscription is required to access this feature.`,
        subscriptionRequired: type,
      });
      return;
    }

    next();
  };
};
