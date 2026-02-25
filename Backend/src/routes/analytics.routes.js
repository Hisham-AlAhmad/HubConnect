/**
 * Analytics routes  (instructor/admin only)
 * GET /api/analytics/submission-stats
 * GET /api/analytics/timeline
 * GET /api/analytics/rankings
 * GET /api/analytics/on-time-late
 */
import { Router } from 'express';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);
router.use(authorize('admin', 'instructor'));

/* GET /analytics/submission-stats */
router.get('/submission-stats', async (_req, res, next) => {
    try {
        const [stats] = await sql`
            SELECT
                COUNT(*)                                                    AS total_tasks,
                COUNT(*) FILTER (WHERE status IN ('submitted','accepted'))  AS submitted_tasks,
                COUNT(*) FILTER (WHERE status = 'pending')                  AS pending_tasks,
                ROUND(
                    COUNT(*) FILTER (WHERE status IN ('submitted','accepted')) * 100.0
                    / NULLIF(COUNT(*), 0), 1
                )                                                           AS submission_rate
            FROM tasks WHERE deleted_at IS NULL
        `;
        res.json({
            success: true,
            data: {
                totalTasks:     parseInt(stats.total_tasks     ?? 0),
                submittedTasks: parseInt(stats.submitted_tasks ?? 0),
                pendingTasks:   parseInt(stats.pending_tasks   ?? 0),
                submissionRate: parseFloat(stats.submission_rate ?? 0),
            },
        });
    } catch (err) { next(err); }
});

/* GET /analytics/timeline */
router.get('/timeline', async (_req, res, next) => {
    try {
        const rows = await sql`
            SELECT
                TO_CHAR(s.submitted_at, 'Mon') AS month,
                COUNT(*) FILTER (
                    WHERE s.submitted_at <= (t.due_date::timestamptz + INTERVAL '23:59:59')
                ) AS on_time,
                COUNT(*) FILTER (
                    WHERE s.submitted_at > (t.due_date::timestamptz + INTERVAL '23:59:59')
                ) AS late
            FROM submissions s
            JOIN tasks t ON t.id = s.task_id
            WHERE s.submitted_at >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY TO_CHAR(s.submitted_at, 'Mon'), DATE_TRUNC('month', s.submitted_at)
            ORDER BY DATE_TRUNC('month', s.submitted_at)
        `;
        res.json({
            success: true,
            data: rows.map(r => ({ month: r.month, onTime: parseInt(r.on_time ?? 0), late: parseInt(r.late ?? 0) })),
        });
    } catch (err) { next(err); }
});

/* GET /analytics/rankings */
router.get('/rankings', async (_req, res, next) => {
    try {
        const rows = await sql`
            SELECT t.id, t.name AS team_name,
                   COUNT(s.id) AS submissions,
                   ROUND(
                       COUNT(s.id) * 100.0
                       / NULLIF((SELECT COUNT(*) FROM tasks tsk WHERE tsk.team_id = t.id AND tsk.deleted_at IS NULL), 0)
                   , 1) AS score
            FROM teams t
            LEFT JOIN submissions s ON s.team_id = t.id
            GROUP BY t.id, t.name
            ORDER BY score DESC NULLS LAST, submissions DESC
        `;
        res.json({
            success: true,
            data: rows.map(r => ({ id: r.id, teamName: r.team_name, submissions: parseInt(r.submissions ?? 0), score: parseFloat(r.score ?? 0) })),
        });
    } catch (err) { next(err); }
});

/* GET /analytics/on-time-late */
router.get('/on-time-late', async (_req, res, next) => {
    try {
        const [row] = await sql`
            SELECT
                COUNT(*) FILTER (WHERE s.submitted_at <= (t.due_date::timestamptz + INTERVAL '23:59:59')) AS on_time,
                COUNT(*) FILTER (WHERE s.submitted_at >  (t.due_date::timestamptz + INTERVAL '23:59:59')) AS late
            FROM submissions s
            JOIN tasks t ON t.id = s.task_id
        `;
        const onTime = parseInt(row.on_time ?? 0);
        const late   = parseInt(row.late   ?? 0);
        const total  = onTime + late || 1;
        res.json({
            success: true,
            data: [
                { name: 'On Time', value: onTime, percentage: Math.round(onTime / total * 100) },
                { name: 'Late',    value: late,   percentage: Math.round(late   / total * 100) },
            ],
        });
    } catch (err) { next(err); }
});

export default router;
