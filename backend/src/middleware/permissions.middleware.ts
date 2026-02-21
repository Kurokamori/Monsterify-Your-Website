import { Request, Response, NextFunction } from 'express';

/**
 * Admin authorization middleware.
 *
 * Must be used after an authentication middleware (`authenticate`, `authenticateDiscord`, etc.).
 * Checks that the authenticated user has admin privileges.
 * Responds with 403 if not.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.is_admin) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'FORBIDDEN',
    message: 'Admin access required',
  });
}

/**
 * Ownership middleware factory.
 *
 * Creates a middleware that checks whether the authenticated user
 * owns the resource identified by the given route parameter.
 * "Ownership" means the resource's `user_id` (or the configured field)
 * matches `req.user.id`.
 *
 * Admins bypass the ownership check.
 *
 * @param paramName - The route parameter name containing the resource owner's user ID.
 *   For example, if the route is `/trainers/:trainerId`, pass the function that
 *   extracts the owner ID from the request (typically by querying the database in
 *   the controller). For simple cases where the route param IS the user ID, pass
 *   the param name directly.
 *
 * @example
 * // Route param `:userId` is directly the owner
 * router.put('/users/:userId/settings', authenticate, requireOwnership('userId'), handler);
 */
export function requireOwnership(paramName: string): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    // Admins bypass ownership checks
    if (req.user.is_admin) {
      next();
      return;
    }

    const resourceOwnerId = Number(req.params[paramName]);
    if (Number.isNaN(resourceOwnerId)) {
      res.status(400).json({
        success: false,
        error: 'INVALID_PARAM',
        message: `Invalid parameter: ${paramName}`,
      });
      return;
    }

    if (req.user.id !== resourceOwnerId) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'You do not have permission to access this resource',
      });
      return;
    }

    next();
  };
}

/**
 * Require that the request originated from the Discord bot.
 *
 * Must be used after an authentication middleware that sets `req.authSource`.
 * Responds with 403 if the request did not come through the bot auth flow.
 */
export function requireBotOrigin(req: Request, res: Response, next: NextFunction): void {
  if (req.authSource === 'discord') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'FORBIDDEN',
    message: 'This endpoint is only accessible via the Discord bot',
  });
}

/**
 * Require that the request originated from the website (JWT session).
 *
 * Must be used after an authentication middleware that sets `req.authSource`.
 * Responds with 403 if the request did not come through JWT auth.
 */
export function requireWebOrigin(req: Request, res: Response, next: NextFunction): void {
  if (req.authSource === 'jwt' || req.authSource === 'session') {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    error: 'FORBIDDEN',
    message: 'This endpoint is only accessible via the website',
  });
}
