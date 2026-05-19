import { Response, NextFunction } from 'express';
import { AuthRequest } from './verifyToken';

export const requireRole = (roles: ('driver' | 'owner' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role as any)) {
      res.status(403).json({ message: 'Access denied: insufficient permissions' });
      return;
    }
    next();
  };
};
