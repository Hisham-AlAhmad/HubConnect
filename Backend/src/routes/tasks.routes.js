/**
 * Tasks routes
 * GET    /api/tasks
 * GET    /api/tasks/my
 * GET    /api/tasks/:id
 * POST   /api/tasks             (instructor/admin/team_leader)
 * PUT    /api/tasks/:id         (instructor/admin/team_leader)
 * DELETE /api/tasks/:id         (instructor/admin)
 * POST   /api/tasks/:id/assign  (instructor/admin)
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* GET /tasks — all tasks visible to the caller */
router.get('/', async (req, res, next) => {
    try {
        const { role, id: userId } = req.user;
        let tasks;
        if (role === 'admin' || role === 'instructor') {
            tasks = await sql`
                SELECT t.*, p.full_name AS assignee_name, tm.name AS team_name
                FROM tasks t
                LEFT JOIN profiles p ON p.id = t.assignee_id
                LEFT JOIN teams tm ON tm.id = t.team_id
                WHERE t.deleted_at IS NULL
                ORDER BY t.created_at DESC
            `;
        } else {
            // student / team_leader — tasks assigned to their team
            tasks = await sql`
                SELECT t.*, p.full_name AS assignee_name, tm.name AS team_name
                FROM tasks t
                LEFT JOIN profiles p ON p.id = t.assignee_id
                LEFT JOIN teams tm ON tm.id = t.team_id
                LEFT JOIN team_members mbr ON mbr.team_id = t.team_id
                WHERE t.deleted_at IS NULL
                  AND (t.assignee_id = ${userId} OR mbr.user_id = ${userId})
                ORDER BY t.created_at DESC
            `;
        }
        res.json({ success: true, data: tasks });
    } catch (err) { next(err); }
});

/* GET /tasks/my */
router.get('/my', async (req, res, next) => {
    try {
        const { id: userId } = req.user;
        const tasks = await sql`
            SELECT t.*, p.full_name AS assignee_name, tm.name AS team_name
            FROM tasks t
            LEFT JOIN profiles p ON p.id = t.assignee_id
            LEFT JOIN teams tm ON tm.id = t.team_id
            LEFT JOIN team_members mbr ON mbr.team_id = t.team_id AND mbr.user_id = ${userId}
            WHERE t.deleted_at IS NULL
              AND (t.assignee_id = ${userId} OR mbr.user_id = ${userId})
            ORDER BY t.due_date ASC
        `;
        res.json({ success: true, data: tasks });
    } catch (err) { next(err); }
});

/* GET /tasks/:id */
router.get('/:id', async (req, res, next) => {
    try {
        const [task] = await sql`
            SELECT t.*, p.full_name AS assignee_name, tm.name AS team_name,
                   cr.full_name AS created_by_name
            FROM tasks t
            LEFT JOIN profiles p  ON p.id  = t.assignee_id
            LEFT JOIN teams tm    ON tm.id = t.team_id
            LEFT JOIN profiles cr ON cr.id = t.created_by
            WHERE t.id = ${req.params.id} AND t.deleted_at IS NULL
        `;
        if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
        res.json({ success: true, data: task });
    } catch (err) { next(err); }
});

/* POST /tasks */
router.post(
    '/',
    authorize('admin', 'instructor', 'team_leader'),
    [
        body('title').trim().notEmpty(),
        body('courseId').isUUID(),
        body('dueDate').isISO8601().toDate(),
        body('organizationId').isUUID(),
        body('priority').optional().isIn(['low', 'medium', 'high']),
        body('teamId').optional().isUUID(),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { title, description, courseId, teamId, organizationId, dueDate, priority = 'medium', githubRepoUrl, assigneeId } = req.body;
            const [task] = await sql`
                INSERT INTO tasks (organization_id, course_id, team_id, title, description, priority, due_date, github_repo_url, assignee_id, created_by)
                VALUES (${organizationId}, ${courseId}, ${teamId ?? null}, ${title}, ${description ?? null},
                        ${priority}, ${dueDate}, ${githubRepoUrl ?? null}, ${assigneeId ?? null}, ${req.user.id})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: task });
        } catch (err) { next(err); }
    }
);

/* PUT /tasks/:id */
router.put(
    '/:id',
    authorize('admin', 'instructor', 'team_leader'),
    [
        body('title').optional().trim().notEmpty(),
        body('priority').optional().isIn(['low', 'medium', 'high']),
        body('status').optional().isIn(['pending', 'in_progress', 'submitted', 'accepted', 'rejected']),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { title, description, priority, status, dueDate, githubRepoUrl, assigneeId } = req.body;
            const [task] = await sql`
                UPDATE tasks
                SET title          = COALESCE(${title          ?? null}, title),
                    description    = COALESCE(${description    ?? null}, description),
                    priority       = COALESCE(${priority       ?? null}::task_priority, priority),
                    status         = COALESCE(${status         ?? null}::task_status, status),
                    due_date       = COALESCE(${dueDate        ?? null}::date, due_date),
                    github_repo_url= COALESCE(${githubRepoUrl ?? null}, github_repo_url),
                    assignee_id    = COALESCE(${assigneeId     ?? null}::uuid, assignee_id),
                    updated_at     = CURRENT_TIMESTAMP
                WHERE id = ${req.params.id} AND deleted_at IS NULL
                RETURNING *
            `;
            if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
            res.json({ success: true, data: task });
        } catch (err) { next(err); }
    }
);

/* DELETE /tasks/:id (soft delete) */
router.delete('/:id', authorize('admin', 'instructor'), async (req, res, next) => {
    try {
        const [task] = await sql`
            UPDATE tasks SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${req.params.id} AND deleted_at IS NULL RETURNING id
        `;
        if (!task) return res.status(404).json({ success: false, error: 'Task not found.' });
        res.json({ success: true, message: 'Task deleted.' });
    } catch (err) { next(err); }
});

export default router;
