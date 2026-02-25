/**
 * Teams routes
 * GET    /api/teams
 * GET    /api/teams/:id
 * GET    /api/teams/:id/members
 * POST   /api/teams
 * PUT    /api/teams/:id
 * DELETE /api/teams/:id
 * POST   /api/teams/:id/members
 * DELETE /api/teams/:id/members/:userId
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* GET /teams */
router.get('/', async (req, res, next) => {
    try {
        const teams = await sql`
            SELECT t.*, c.name AS course_name, p.full_name AS leader_name,
                   COUNT(tm.id) AS member_count
            FROM teams t
            LEFT JOIN courses c ON c.id = t.course_id
            LEFT JOIN profiles p ON p.id = t.team_leader_id
            LEFT JOIN team_members tm ON tm.team_id = t.id
            GROUP BY t.id, c.name, p.full_name
            ORDER BY t.created_at DESC
        `;
        res.json({ success: true, data: teams });
    } catch (err) { next(err); }
});

/* GET /teams/:id */
router.get('/:id', async (req, res, next) => {
    try {
        const [team] = await sql`
            SELECT t.*, c.name AS course_name, p.full_name AS leader_name
            FROM teams t
            LEFT JOIN courses c ON c.id = t.course_id
            LEFT JOIN profiles p ON p.id = t.team_leader_id
            WHERE t.id = ${req.params.id}
        `;
        if (!team) return res.status(404).json({ success: false, error: 'Team not found.' });
        res.json({ success: true, data: team });
    } catch (err) { next(err); }
});

/* GET /teams/:id/members */
router.get('/:id/members', async (req, res, next) => {
    try {
        const members = await sql`
            SELECT tm.*, p.full_name, p.avatar_url, p.email, p.role
            FROM team_members tm
            LEFT JOIN profiles p ON p.id = tm.user_id
            WHERE tm.team_id = ${req.params.id}
            ORDER BY p.full_name
        `;
        res.json({ success: true, data: members });
    } catch (err) { next(err); }
});

/* POST /teams */
router.post(
    '/',
    authorize('admin', 'instructor'),
    [
        body('name').trim().notEmpty(),
        body('courseId').isUUID(),
        body('organizationId').isUUID(),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { name, description, courseId, organizationId, teamLeaderId, maxMembers } = req.body;
            const [team] = await sql`
                INSERT INTO teams (organization_id, course_id, name, description, team_leader_id, max_members, created_by)
                VALUES (${organizationId}, ${courseId}, ${name}, ${description ?? null},
                        ${teamLeaderId ?? null}, ${maxMembers ?? 10}, ${req.user.id})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: team });
        } catch (err) { next(err); }
    }
);

/* PUT /teams/:id */
router.put(
    '/:id',
    authorize('admin', 'instructor'),
    [body('name').optional().trim().notEmpty()],
    validate,
    async (req, res, next) => {
        try {
            const { name, description, teamLeaderId, maxMembers } = req.body;
            const [team] = await sql`
                UPDATE teams
                SET name           = COALESCE(${name           ?? null}, name),
                    description    = COALESCE(${description    ?? null}, description),
                    team_leader_id = COALESCE(${teamLeaderId   ?? null}::uuid, team_leader_id),
                    max_members    = COALESCE(${maxMembers      ?? null}::int, max_members),
                    updated_at     = CURRENT_TIMESTAMP
                WHERE id = ${req.params.id}
                RETURNING *
            `;
            if (!team) return res.status(404).json({ success: false, error: 'Team not found.' });
            res.json({ success: true, data: team });
        } catch (err) { next(err); }
    }
);

/* DELETE /teams/:id */
router.delete('/:id', authorize('admin', 'instructor'), async (req, res, next) => {
    try {
        await sql`DELETE FROM team_members WHERE team_id = ${req.params.id}`;
        const result = await sql`DELETE FROM teams WHERE id = ${req.params.id} RETURNING id`;
        if (!result.length) return res.status(404).json({ success: false, error: 'Team not found.' });
        res.json({ success: true, message: 'Team deleted.' });
    } catch (err) { next(err); }
});

/* POST /teams/:id/members */
router.post(
    '/:id/members',
    authorize('admin', 'instructor'),
    [body('userId').isUUID()],
    validate,
    async (req, res, next) => {
        try {
            const [team] = await sql`SELECT organization_id, course_id FROM teams WHERE id = ${req.params.id}`;
            if (!team) return res.status(404).json({ success: false, error: 'Team not found.' });

            // Check if student is already in another team for the same course
            if (team.course_id) {
                const [existing] = await sql`
                    SELECT tm.id, t.name AS team_name
                    FROM team_members tm
                    JOIN teams t ON t.id = tm.team_id
                    WHERE tm.user_id = ${req.body.userId} AND t.course_id = ${team.course_id} AND tm.team_id != ${req.params.id}
                `;
                if (existing) {
                    return res.status(409).json({ success: false, error: `Student is already in team "${existing.team_name}" for this course.` });
                }
            }

            const [member] = await sql`
                INSERT INTO team_members (organization_id, team_id, user_id, course_id)
                VALUES (${team.organization_id}, ${req.params.id}, ${req.body.userId}, ${team.course_id ?? null})
                ON CONFLICT (team_id, user_id) DO NOTHING
                RETURNING *
            `;
            res.status(201).json({ success: true, data: member });
        } catch (err) { next(err); }
    }
);

/* DELETE /teams/:id/members/:userId */
router.delete('/:id/members/:userId', authorize('admin', 'instructor'), async (req, res, next) => {
    try {
        await sql`DELETE FROM team_members WHERE team_id = ${req.params.id} AND user_id = ${req.params.userId}`;
        res.json({ success: true, message: 'Member removed.' });
    } catch (err) { next(err); }
});

export default router;
