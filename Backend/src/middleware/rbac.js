/**
 * Role-based access control middleware factory.
 * Usage:  router.get('/admin-only', authenticate, authorize('admin'), handler)
 *         router.post('/task',       authenticate, authorize('admin','instructor'), handler)
 */
export const authorize = (...allowedRoles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
        });
    }

    next();
};
