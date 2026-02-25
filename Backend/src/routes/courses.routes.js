/**
 * Courses routes
 * GET    /api/courses
 * GET    /api/courses/:id
 * POST   /api/courses
 * PUT    /api/courses/:id
 * PATCH  /api/courses/:id/finish
 * POST   /api/courses/:id/teams
 * DELETE /api/courses/:id/teams/:teamId
 * POST   /api/courses/:id/teams/:teamId/leader
 * POST   /api/courses/:id/teams/:teamId/members
 * DELETE /api/courses/:id/teams/:teamId/members/:userId
 * GET    /api/courses/:id/tasks
 * POST   /api/courses/:id/tasks
 * PUT    /api/courses/:id/tasks/:taskId
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* GET /courses */
router.get('/', async (req, res, next) => {
    try {
        const { role, id: userId } = req.user;
        let courses;
        if (role === 'admin' || role === 'instructor') {
            courses = await sql`
                SELECT c.*, co.name AS cohort_name,
                       p.full_name AS created_by_name,
                       (SELECT COUNT(*) FROM teams t WHERE t.course_id = c.id) AS team_count
                FROM courses c
                LEFT JOIN cohorts co ON co.id = c.cohort_id
                LEFT JOIN profiles p ON p.id = c.created_by
                ORDER BY c.created_at DESC
            `;
        } else {
            courses = await sql`
                SELECT DISTINCT c.*, co.name AS cohort_name,
                       p.full_name AS created_by_name
                FROM courses c
                LEFT JOIN cohorts co ON co.id = c.cohort_id
                LEFT JOIN profiles p ON p.id = c.created_by
                LEFT JOIN teams t ON t.course_id = c.id
                LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = ${userId}
                WHERE tm.user_id IS NOT NULL
                ORDER BY c.created_at DESC
            `;
        }
        res.json({ success: true, data: courses });
    } catch (err) { next(err); }
});

/* GET /courses/:id */
router.get('/:id', async (req, res, next) => {
    try {
        const [course] = await sql`SELECT * FROM courses WHERE id = ${req.params.id}`;
        if (!course) return res.status(404).json({ success: false, error: 'Course not found.' });

        const teams = await sql`
            SELECT t.*,
                   p.full_name AS leader_name,
                   (
                       SELECT json_agg(json_build_object('id', pr.id, 'email', pr.email, 'full_name', pr.full_name, 'role', tm2.role))
                       FROM team_members tm2
                       JOIN profiles pr ON pr.id = tm2.user_id
                       WHERE tm2.team_id = t.id
                   ) AS members
            FROM teams t
            LEFT JOIN profiles p ON p.id = t.team_leader_id
            WHERE t.course_id = ${req.params.id}
            ORDER BY t.created_at
        `;
        res.json({ success: true, data: { ...course, teams } });
    } catch (err) { next(err); }
});

/* POST /courses */
router.post(
    '/',
    authorize('admin', 'instructor'),
    [
        body('name').trim().notEmpty(),
        body('cohortId').isUUID(),
        body('organizationId').isUUID(),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { name, description, cohortId, organizationId, endDate } = req.body;
            const [course] = await sql`
                INSERT INTO courses (organization_id, cohort_id, name, description, end_date, created_by)
                VALUES (${organizationId}, ${cohortId}, ${name}, ${description ?? null}, ${endDate ?? null}, ${req.user.id})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: course });
        } catch (err) { next(err); }
    }
);

/* PUT /courses/:id */
router.put(
    '/:id',
    authorize('admin', 'instructor'),
    [body('name').optional().trim().notEmpty()],
    validate,
    async (req, res, next) => {
        try {
            const { name, description, endDate, status } = req.body;
            const [course] = await sql`
                UPDATE courses
                SET name        = COALESCE(${name        ?? null}, name),
                    description = COALESCE(${description ?? null}, description),
                    end_date    = COALESCE(${endDate     ?? null}::date, end_date),
                    status      = COALESCE(${status      ?? null}::course_status, status),
                    updated_at  = CURRENT_TIMESTAMP
                WHERE id = ${req.params.id}
                RETURNING *
            `;
            if (!course) return res.status(404).json({ success: false, error: 'Course not found.' });
            res.json({ success: true, data: course });
        } catch (err) { next(err); }
    }
);

/* PATCH /courses/:id/finish */
router.patch('/:id/finish', authorize('admin', 'instructor'), async (req, res, next) => {
    try {
        const [course] = await sql`
            UPDATE courses SET status = 'completed', updated_at = CURRENT_TIMESTAMP
            WHERE id = ${req.params.id} RETURNING *
        `;
        if (!course) return res.status(404).json({ success: false, error: 'Course not found.' });
        res.json({ success: true, data: course });
    } catch (err) { next(err); }
});

/* POST /courses/:id/teams */
router.post(
    '/:id/teams',
    authorize('admin', 'instructor'),
    [body('name').trim().notEmpty()],
    validate,
    async (req, res, next) => {
        try {
            const [course] = await sql`SELECT organization_id FROM courses WHERE id = ${req.params.id}`;
            if (!course) return res.status(404).json({ success: false, error: 'Course not found.' });
            const { name, description, maxMembers } = req.body;
            const [team] = await sql`
                INSERT INTO teams (organization_id, course_id, name, description, max_members, created_by)
                VALUES (${course.organization_id}, ${req.params.id}, ${name}, ${description ?? null}, ${maxMembers ?? 10}, ${req.user.id})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: team });
        } catch (err) { next(err); }
    }
);

/* DELETE /courses/:id/teams/:teamId */
router.delete('/:id/teams/:teamId', authorize('admin', 'instructor'), async (req, res, next) => {
    try {
        await sql`DELETE FROM team_members WHERE team_id = ${req.params.teamId}`;
        await sql`DELETE FROM teams WHERE id = ${req.params.teamId} AND course_id = ${req.params.id}`;
        res.json({ success: true, message: 'Team removed from course.' });
    } catch (err) { next(err); }
});

/* POST /courses/:id/teams/:teamId/leader */
router.post(
    '/:id/teams/:teamId/leader',
    authorize('admin', 'instructor'),
    [body('studentId').optional().isUUID(), body('userId').optional().isUUID()],
    validate,
    async (req, res, next) => {
        try {
            const leaderId = req.body.studentId || req.body.userId;
            if (!leaderId) return res.status(400).json({ success: false, error: 'studentId or userId is required.' });

            // Ensure the user is a member of the team
            const [membership] = await sql`
                SELECT id FROM team_members WHERE team_id = ${req.params.teamId} AND user_id = ${leaderId}
            `;
            if (!membership) return res.status(400).json({ success: false, error: 'User must be a member of the team to be assigned as leader.' });

            // Update team leader
            await sql`
                UPDATE teams SET team_leader_id = ${leaderId}, updated_at = CURRENT_TIMESTAMP
                WHERE id = ${req.params.teamId} AND course_id = ${req.params.id}
            `;

            // Update is_leader flags in team_members
            await sql`UPDATE team_members SET is_leader = false WHERE team_id = ${req.params.teamId}`;
            await sql`UPDATE team_members SET is_leader = true WHERE team_id = ${req.params.teamId} AND user_id = ${leaderId}`;

            // Update user role to team_leader if currently student
            await sql`UPDATE profiles SET role = 'team_leader' WHERE id = ${leaderId} AND role = 'student'`;

            res.json({ success: true, message: 'Team leader assigned.' });
        } catch (err) { next(err); }
    }
);

/* POST /courses/:id/teams/:teamId/members */
router.post(
    '/:id/teams/:teamId/members',
    authorize('admin', 'instructor'),
    [body('studentId').optional().isUUID(), body('userId').optional().isUUID()],
    validate,
    async (req, res, next) => {
        try {
            const studentId = req.body.studentId || req.body.userId;
            if (!studentId) return res.status(400).json({ success: false, error: 'studentId or userId is required.' });

            const [team] = await sql`SELECT organization_id, course_id FROM teams WHERE id = ${req.params.teamId}`;
            if (!team) return res.status(404).json({ success: false, error: 'Team not found.' });

            // Check if student is already in another team for the same course
            const [existing] = await sql`
                SELECT tm.id, t.name AS team_name
                FROM team_members tm
                JOIN teams t ON t.id = tm.team_id
                WHERE tm.user_id = ${studentId} AND t.course_id = ${team.course_id} AND tm.team_id != ${req.params.teamId}
            `;
            if (existing) {
                return res.status(409).json({ success: false, error: `Student is already in team "${existing.team_name}" for this course.` });
            }

            const [member] = await sql`
                INSERT INTO team_members (organization_id, team_id, user_id, course_id)
                VALUES (${team.organization_id}, ${req.params.teamId}, ${studentId}, ${team.course_id})
                ON CONFLICT (team_id, user_id) DO NOTHING
                RETURNING *
            `;
            res.status(201).json({ success: true, data: member });
        } catch (err) { next(err); }
    }
);

/* DELETE /courses/:id/teams/:teamId/members/:userId */
router.delete('/:id/teams/:teamId/members/:userId', authorize('admin', 'instructor'), async (req, res, next) => {
    try {
        await sql`DELETE FROM team_members WHERE team_id = ${req.params.teamId} AND user_id = ${req.params.userId}`;
        res.json({ success: true, message: 'Member removed.' });
    } catch (err) { next(err); }
});

/* GET /courses/:id/tasks */
router.get('/:id/tasks', async (req, res, next) => {
    try {
        const tasks = await sql`
            SELECT t.*, p.full_name AS assignee_name, tm.name AS team_name
            FROM tasks t
            LEFT JOIN profiles p ON p.id = t.assignee_id
            LEFT JOIN teams tm ON tm.id = t.team_id
            WHERE t.course_id = ${req.params.id} AND t.deleted_at IS NULL
            ORDER BY t.created_at DESC
        `;
        res.json({ success: true, data: tasks });
    } catch (err) { next(err); }
});

/* POST /courses/:id/tasks */
router.post(
    '/:id/tasks',
    authorize('admin', 'instructor', 'team_leader'),
    [body('title').trim().notEmpty(), body('dueDate').isISO8601()],
    validate,
    async (req, res, next) => {
        try {
            const [course] = await sql`SELECT organization_id FROM courses WHERE id = ${req.params.id}`;
            if (!course) return res.status(404).json({ success: false, error: 'Course not found.' });
            const { title, description, priority, dueDate, teamId, assigneeId } = req.body;
            const [task] = await sql`
                INSERT INTO tasks (organization_id, course_id, team_id, title, description, priority, due_date, assignee_id, created_by)
                VALUES (${course.organization_id}, ${req.params.id}, ${teamId ?? null}, ${title},
                        ${description ?? null}, ${priority ?? 'medium'}, ${dueDate}, ${assigneeId ?? null}, ${req.user.id})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: task });
        } catch (err) { next(err); }
    }
);

/* PUT /courses/:id/tasks/:taskId */
router.put(
    '/:id/tasks/:taskId',
    authorize('admin', 'instructor', 'team_leader'),
    [body('title').optional().trim().notEmpty()],
    validate,
    async (req, res, next) => {
        try {
            const { title, description, priority, status, dueDate } = req.body;
            const [task] = await sql`
                UPDATE tasks
                SET title       = COALESCE(${title       ?? null}, title),
                    description = COALESCE(${description ?? null}, description),
                    priority    = COALESCE(${priority    ?? null}::task_priority, priority),
                    status      = COALESCE(${status      ?? null}::task_status, status),
                    due_date    = COALESCE(${dueDate     ?? null}::date, due_date),
                    updated_at  = CURRENT_TIMESTAMP
                WHERE id = ${req.params.taskId} AND course_id = ${req.params.id}
                RETURNING *
            `;
            if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
            res.json({ success: true, data: task });
        } catch (err) { next(err); }
    }
);

export default router;
