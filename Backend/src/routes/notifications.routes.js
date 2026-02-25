/**
 * Notifications routes
 * GET  /api/notifications
 * PUT  /api/notifications/read-all
 * PUT  /api/notifications/:id/read
 */
import { Router } from 'express';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

/* GET /notifications */
router.get('/', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit ?? '30'), 100);
        const notifications = await sql`
            SELECT n.*, p.full_name AS actor_name, p.avatar_url AS actor_avatar
            FROM notifications n
            LEFT JOIN profiles p ON p.id = n.actor_id
            WHERE n.recipient_id = ${req.user.id} AND n.status != 'archived'
            ORDER BY n.created_at DESC
            LIMIT ${limit}
        `;
        const unreadCount = notifications.filter(n => n.status === 'unread').length;
        res.json({ success: true, data: { notifications, unreadCount } });
    } catch (err) { next(err); }
});

/* PUT /notifications/read-all  — must be before /:id */
router.put('/read-all', async (req, res, next) => {
    try {
        await sql`
            UPDATE notifications
            SET status = 'read', read_at = CURRENT_TIMESTAMP
            WHERE recipient_id = ${req.user.id} AND status = 'unread'
        `;
        res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) { next(err); }
});

/* PUT /notifications/:id/read */
router.put('/:id/read', async (req, res, next) => {
    try {
        const [notification] = await sql`
            UPDATE notifications
            SET status = 'read', read_at = CURRENT_TIMESTAMP
            WHERE id = ${req.params.id} AND recipient_id = ${req.user.id}
            RETURNING id
        `;
        if (!notification) return res.status(404).json({ success: false, error: 'Notification not found.' });
        res.json({ success: true, message: 'Marked as read.' });
    } catch (err) { next(err); }
});

export default router;
