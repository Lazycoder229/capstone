import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/middleware/errorHandler';

export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`,
          403
        )
      );
    }

    next();
  };
}

// Helper — check kung ang user mismo ang nagmamay-ari ng resource, o kung admin/owner siya
export function authorizeOwnerOrRoles(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    const isOwnerOfResource = req.user.id === req.params.id;
    const hasAllowedRole = allowedRoles.includes(req.user.role);

    if (!isOwnerOfResource && !hasAllowedRole) {
      return next(new AppError('Access denied', 403));
    }

    next();
  };
}