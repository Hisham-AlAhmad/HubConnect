/**
 * Submissions routes
 * GET    /api/submissions
 * GET    /api/submissions/check/:taskId
 * GET    /api/submissions/task/:taskId
 * GET    /api/submissions/:id
 * POST   /api/submissions
 * PUT    /api/submissions/:id/review   (instructor/admin)
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* GET /submissions — all (admin/instructor) or own (student) */
router.get('/', async (req, res, next) => {
    try {
        const { role, id: userId } = req.user;
        let submissions;
        if (role === 'admin' || role === 'instructor') {
            submissions = await sql`
                SELECT s.*, t.title AS task_title, p.full_name AS submitted_by_name,
                       tm.name AS team_name
                FROM submissions s
                JOIN tasks t ON t.id = s.task_id
                LEFT JOIN profiles p ON p.id = s.submitted_by
                LEFT JOIN teams tm ON tm.id = s.team_id
                ORDER BY s.submitted_at DESC
            `;
        } else {
            submissions = await sql`
                SELECT s.*, t.title AS task_title, tm.name AS team_name
                FROM submissions s
                JOIN tasks t ON t.id = s.task_id
                LEFT JOIN team_members mbr ON mbr.team_id = s.team_id AND mbr.user_id = ${userId}
                LEFT JOIN teams tm ON tm.id = s.team_id
                WHERE s.submitted_by = ${userId} OR mbr.user_id = ${userId}
                ORDER BY s.submitted_at DESC
            `;
        }
        res.json({ success: true, data: submissions });
    } catch (err) { next(err); }
});

/* GET /submissions/check/:taskId — has the current user/team submitted this task? */
router.get('/check/:taskId', async (req, res, next) => {
    try {
        const [teamMember] = await sql`SELECT team_id FROM team_members WHERE user_id = ${req.user.id} LIMIT 1`;
        const [submission] = await sql`
            SELECT * FROM submissions
            WHERE task_id = ${req.params.taskId}
              AND (submitted_by = ${req.user.id} OR team_id = ${teamMember?.team_id ?? null})
            LIMIT 1
        `;
        res.json({ success: true, data: submission ?? null });
    } catch (err) { next(err); }
});

/* GET /submissions/task/:taskId */
router.get('/task/:taskId', async (req, res, next) => {
    try {
        const submissions = await sql`
            SELECT s.*, p.full_name AS submitted_by_name, tm.name AS team_name
            FROM submissions s
            LEFT JOIN profiles p ON p.id = s.submitted_by
            LEFT JOIN teams tm ON tm.id = s.team_id
            WHERE s.task_id = ${req.params.taskId}
            ORDER BY s.submitted_at DESC
        `;
        res.json({ success: true, data: submissions });
    } catch (err) { next(err); }
});

/* GET /submissions/:id */
router.get('/:id', async (req, res, next) => {
    try {
        const [submission] = await sql`
            SELECT s.*, t.title AS task_title, p.full_name AS submitted_by_name
            FROM submissions s
            JOIN tasks t ON t.id = s.task_id
            LEFT JOIN profiles p ON p.id = s.submitted_by
            WHERE s.id = ${req.params.id}
        `;
        if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });
        res.json({ success: true, data: submission });
    } catch (err) { next(err); }
});

/* POST /submissions */
router.post(
    '/',
    authorize('student', 'team_leader'),
    [
        body('taskId').isUUID(),
        body('organizationId').isUUID(),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { taskId, organizationId, githubLink, comment } = req.body;
            const [teamMember] = await sql`SELECT team_id FROM team_members WHERE user_id = ${req.user.id} LIMIT 1`;

            const [existing] = await sql`
                SELECT id FROM submissions
                WHERE task_id = ${taskId}
                  AND (submitted_by = ${req.user.id} OR team_id = ${teamMember?.team_id ?? null})
                LIMIT 1
            `;
            if (existing) return res.status(409).json({ success: false, error: 'Task already submitted.' });

            const [submission] = await sql`
                INSERT INTO submissions (organization_id, task_id, team_id, submitted_by, status, github_link, comment)
                VALUES (${organizationId}, ${taskId}, ${teamMember?.team_id ?? null},
                        ${req.user.id}, 'submitted', ${githubLink ?? null}, ${comment ?? null})
                RETURNING *
            `;

            // Update task status
            await sql`UPDATE tasks SET status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ${taskId}`;

            res.status(201).json({ success: true, data: submission });
        } catch (err) { next(err); }
    }
);

/* PUT /submissions/:id/review */
router.put(
    '/:id/review',
    authorize('admin', 'instructor'),
    [
        body('status').isIn(['accepted', 'rejected', 'revision_requested']),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { status, reviewComment } = req.body;
            const [submission] = await sql`
                UPDATE submissions
                SET status         = ${status}::submission_status,
                    reviewed_by    = ${req.user.id},
                    reviewed_at    = CURRENT_TIMESTAMP,
                    review_comment = ${reviewComment ?? null},
                    updated_at     = CURRENT_TIMESTAMP
                WHERE id = ${req.params.id}
                RETURNING *
            `;
            if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });

            // Sync task status
            const taskStatus = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : 'in_progress';
            await sql`UPDATE tasks SET status = ${taskStatus}::task_status, updated_at = CURRENT_TIMESTAMP WHERE id = ${submission.task_id}`;

            res.json({ success: true, data: submission });
        } catch (err) { next(err); }
    }
);

export default router;
