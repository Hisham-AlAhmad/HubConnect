/**
 * Chat routes
 * GET  /api/chat/rooms
 * POST /api/chat/rooms
 * GET  /api/chat/rooms/:id/messages
 * POST /api/chat/rooms/:id/messages
 * GET  /api/chat/users          – list users available for DM
 * POST /api/chat/dm/:userId     – create / fetch DM room
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* GET /chat/rooms */
router.get('/rooms', async (req, res, next) => {
    try {
        const { role, id: userId } = req.user;

        // Auto-create general chat room if none exists
        const [existingGeneral] = await sql`
            SELECT id FROM chat_rooms WHERE room_type = 'general' LIMIT 1
        `;
        if (!existingGeneral) {
            const [org] = await sql`SELECT id FROM organizations LIMIT 1`;
            if (org) {
                await sql`
                    INSERT INTO chat_rooms (organization_id, room_name, room_type, created_by)
                    VALUES (${org.id}, 'General', 'general', ${userId})
                `;
            }
        }

        let rooms;
        if (role === 'admin' || role === 'instructor') {
            rooms = await sql`
                SELECT cr.*, c.name AS course_name, t.name AS team_name
                FROM chat_rooms cr
                LEFT JOIN courses c ON c.id = cr.course_id
                LEFT JOIN teams t ON t.id = cr.team_id
                ORDER BY cr.created_at DESC
            `;
        } else {
            rooms = await sql`
                SELECT DISTINCT cr.*, c.name AS course_name, t.name AS team_name
                FROM chat_rooms cr
                LEFT JOIN courses c ON c.id = cr.course_id
                LEFT JOIN teams t ON t.id = cr.team_id
                LEFT JOIN team_members tm ON tm.team_id = cr.team_id
                WHERE cr.room_type = 'general'
                   OR (cr.room_type = 'team' AND tm.user_id = ${userId})
                ORDER BY cr.created_at DESC
            `;
        }
        res.json({ success: true, data: rooms });
    } catch (err) { next(err); }
});

/* POST /chat/rooms */
router.post(
    '/rooms',
    authorize('admin', 'instructor'),
    [
        body('roomName').trim().notEmpty(),
        body('roomType').isIn(['general', 'course', 'team']),
        body('organizationId').isUUID(),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { roomName, roomType, organizationId, courseId, teamId } = req.body;
            const [room] = await sql`
                INSERT INTO chat_rooms (organization_id, room_name, room_type, course_id, team_id, created_by)
                VALUES (${organizationId}, ${roomName}, ${roomType}, ${courseId ?? null}, ${teamId ?? null}, ${req.user.id})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: room });
        } catch (err) { next(err); }
    }
);

/* GET /chat/rooms/:id/messages */
router.get('/rooms/:id/messages', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit ?? '50'), 100);
        const before = req.query.before;
        const messages = await sql`
            SELECT m.*, p.full_name AS sender_name, p.avatar_url AS sender_avatar
            FROM messages m
            LEFT JOIN profiles p ON p.id = m.sender_id
            WHERE m.chat_room_id = ${req.params.id}
              AND m.deleted_at IS NULL
            ORDER BY m.created_at DESC
            LIMIT ${limit}
        `;
        res.json({ success: true, data: messages.reverse() });
    } catch (err) { next(err); }
});

/* POST /chat/rooms/:id/messages */
router.post(
    '/rooms/:id/messages',
    [body('content').trim().notEmpty()],
    validate,
    async (req, res, next) => {
        try {
            const [room] = await sql`SELECT organization_id FROM chat_rooms WHERE id = ${req.params.id}`;
            if (!room) return res.status(404).json({ success: false, error: 'Chat room not found.' });

            const [message] = await sql`
                INSERT INTO messages (organization_id, chat_room_id, sender_id, content)
                VALUES (${room.organization_id}, ${req.params.id}, ${req.user.id}, ${req.body.content})
                RETURNING *
            `;

            const [profile] = await sql`SELECT full_name, avatar_url FROM profiles WHERE id = ${req.user.id}`;
            const full = { ...message, sender_name: profile?.full_name, sender_avatar: profile?.avatar_url };

            const io = req.app.get('io');
            io?.to(`room:${req.params.id}`).emit('receive_message', full);

            res.status(201).json({ success: true, data: full });
        } catch (err) { next(err); }
    }
);

/* GET /chat/users – list all users available for DM (exclude self) */
router.get('/users', async (req, res, next) => {
    try {
        const users = await sql`
            SELECT p.id, p.full_name, p.avatar_url, p.role
            FROM profiles p
            WHERE p.id != ${req.user.id}
            ORDER BY p.full_name ASC
        `;
        res.json({ success: true, data: users });
    } catch (err) { next(err); }
});

/* POST /chat/dm/:userId – create or fetch existing DM room */
router.post('/dm/:userId', async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;

        if (currentUserId === targetUserId) {
            return res.status(400).json({ success: false, error: 'Cannot DM yourself.' });
        }

        // Ensure target user exists
        const [targetUser] = await sql`SELECT id, full_name FROM profiles WHERE id = ${targetUserId}`;
        if (!targetUser) return res.status(404).json({ success: false, error: 'User not found.' });

        // Sort UUIDs to create a canonical pair for uniqueness
        const sortedIds = [currentUserId, targetUserId].sort();

        // Check for existing DM room
        const [existing] = await sql`
            SELECT * FROM chat_rooms
            WHERE room_type = 'dm' AND dm_participant_ids = ${sortedIds}
        `;

        if (existing) {
            return res.json({ success: true, data: existing });
        }

        // Get an organization id for the room
        const [org] = await sql`SELECT id FROM organizations LIMIT 1`;
        if (!org) return res.status(500).json({ success: false, error: 'No organization found.' });

        // Fetch current user's name for room name
        const [currentProfile] = await sql`SELECT full_name FROM profiles WHERE id = ${currentUserId}`;

        const roomName = `DM: ${currentProfile?.full_name || 'User'} & ${targetUser.full_name}`;

        const [room] = await sql`
            INSERT INTO chat_rooms (organization_id, room_name, room_type, created_by, dm_participant_ids)
            VALUES (${org.id}, ${roomName}, 'dm', ${currentUserId}, ${sortedIds})
            RETURNING *
        `;

        res.status(201).json({ success: true, data: room });
    } catch (err) { next(err); }
});

/* GET /chat/dm/unread – returns user IDs that have unread DM messages for the current user */
router.get('/dm/unread', async (req, res, next) => {
    try {
        const currentUserId = req.user.id;

        // Find DM rooms where the most recent message was NOT sent by the current user
        // and the room involves the current user
        const rows = await sql`
            SELECT DISTINCT
                CASE
                    WHEN cr.dm_participant_ids[1] = ${currentUserId} THEN cr.dm_participant_ids[2]
                    ELSE cr.dm_participant_ids[1]
                END AS other_user_id
            FROM chat_rooms cr
            WHERE cr.room_type = 'dm'
              AND ${currentUserId} = ANY(cr.dm_participant_ids)
              AND EXISTS (
                  SELECT 1 FROM messages m
                  WHERE m.chat_room_id = cr.id
                    AND m.deleted_at IS NULL
                    AND m.sender_id != ${currentUserId}
                    AND m.created_at > COALESCE(
                        (SELECT MAX(m2.created_at) FROM messages m2
                         WHERE m2.chat_room_id = cr.id
                           AND m2.sender_id = ${currentUserId}
                           AND m2.deleted_at IS NULL),
                        '1970-01-01'::timestamptz
                    )
              )
        `;

        res.json({ success: true, data: rows.map(r => r.other_user_id) });
    } catch (err) { next(err); }
});

export default router;
