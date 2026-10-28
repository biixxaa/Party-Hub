import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireApprovedVerification = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  // Admins bypass normal user identity verification requirements
  if (req.user.role === 'ADMIN') {
    next();
    return;
  }

  if (req.user.verificationStatus !== 'APPROVED') {
    res.status(403).json({
      error: `Access restricted. Your profile identity verification status is currently '${req.user.verificationStatus}'. Identity verification approval is required.`,
      verificationStatus: req.user.verificationStatus
    });
    return;
  }

  next();
};
