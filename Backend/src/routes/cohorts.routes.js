/**
 * Cohorts routes
 * GET    /api/cohorts
 * GET    /api/cohorts/:id
 * POST   /api/cohorts                   (admin)
 * PUT    /api/cohorts/:id               (admin)
 * DELETE /api/cohorts/:id               (admin)
 * POST   /api/cohorts/:id/instructor    (admin)
 * DELETE /api/cohorts/:id/instructor/:uId (admin)
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* GET /cohorts */
router.get('/', async (_req, res, next) => {
    try {
        const cohorts = await sql`
            SELECT c.*, o.name AS organization_name,
                (SELECT COUNT(*) FROM user_cohorts uc WHERE uc.cohort_id = c.id AND uc.role = 'student')::int AS student_count,
                (SELECT COUNT(*) FROM user_cohorts uc WHERE uc.cohort_id = c.id AND uc.role = 'instructor')::int AS instructor_count
            FROM cohorts c
            LEFT JOIN organizations o ON o.id = c.organization_id
            ORDER BY c.start_date DESC
        `;
        res.json({ success: true, data: cohorts });
    } catch (err) { next(err); }
});

/* GET /cohorts/:id */
router.get('/:id', async (req, res, next) => {
    try {
        const [cohort] = await sql`
            SELECT c.*, (
                SELECT json_agg(json_build_object('id', p.id, 'email', p.email, 'role', p.role, 'full_name', p.full_name))
                FROM user_cohorts uc
                JOIN profiles p ON p.id = uc.user_id
                WHERE uc.cohort_id = c.id
            ) AS members
            FROM cohorts c WHERE c.id = ${req.params.id}
        `;
        if (!cohort) return res.status(404).json({ success: false, error: 'Cohort not found.' });
        res.json({ success: true, data: cohort });
    } catch (err) { next(err); }
});

/* POST /cohorts */
router.post(
    '/',
    authorize('admin'),
    [
        body('name').trim().notEmpty(),
        body('startDate').isISO8601(),
        body('endDate').isISO8601(),
        body('organizationId').isUUID(),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { name, code, startDate, endDate, organizationId, academicYear } = req.body;
            const [cohort] = await sql`
                INSERT INTO cohorts (organization_id, name, code, start_date, end_date, academic_year)
                VALUES (${organizationId}, ${name}, ${code ?? null}, ${startDate}, ${endDate}, ${academicYear ?? null})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: cohort });
        } catch (err) { next(err); }
    }
);

/* PUT /cohorts/:id */
router.put(
    '/:id',
    authorize('admin'),
    [body('name').optional().trim().notEmpty()],
    validate,
    async (req, res, next) => {
        try {
            const { name, code, startDate, endDate, isActive, academicYear } = req.body;
            const [cohort] = await sql`
                UPDATE cohorts
                SET name          = COALESCE(${name         ?? null}, name),
                    code          = COALESCE(${code         ?? null}, code),
                    start_date    = COALESCE(${startDate    ?? null}::date, start_date),
                    end_date      = COALESCE(${endDate      ?? null}::date, end_date),
                    is_active     = COALESCE(${isActive     ?? null}::boolean, is_active),
                    academic_year = COALESCE(${academicYear ?? null}, academic_year),
                    updated_at    = CURRENT_TIMESTAMP
                WHERE id = ${req.params.id}
                RETURNING *
            `;
            if (!cohort) return res.status(404).json({ success: false, error: 'Cohort not found.' });
            res.json({ success: true, data: cohort });
        } catch (err) { next(err); }
    }
);

/* DELETE /cohorts/:id */
router.delete('/:id', authorize('admin'), async (req, res, next) => {
    try {
        const result = await sql`DELETE FROM cohorts WHERE id = ${req.params.id} RETURNING id`;
        if (!result.length) return res.status(404).json({ success: false, error: 'Cohort not found.' });
        res.json({ success: true, message: 'Cohort deleted.' });
    } catch (err) { next(err); }
});

/* POST /cohorts/:id/instructor — assign instructor */
router.post(
    '/:id/instructor',
    authorize('admin'),
    [body('instructorId').isUUID()],
    validate,
    async (req, res, next) => {
        try {
            const { instructorId } = req.body;
            const [cohort] = await sql`SELECT organization_id FROM cohorts WHERE id = ${req.params.id}`;
            if (!cohort) return res.status(404).json({ success: false, error: 'Cohort not found.' });
            const [assignment] = await sql`
                INSERT INTO user_cohorts (organization_id, user_id, cohort_id, role)
                VALUES (${cohort.organization_id}, ${instructorId}, ${req.params.id}, 'instructor')
                ON CONFLICT (organization_id, user_id, cohort_id) DO UPDATE SET role = 'instructor'
                RETURNING *
            `;
            res.status(201).json({ success: true, data: assignment });
        } catch (err) { next(err); }
    }
);

/* DELETE /cohorts/:id/instructor/:userId */
router.delete('/:id/instructor/:userId', authorize('admin'), async (req, res, next) => {
    try {
        await sql`
            DELETE FROM user_cohorts
            WHERE cohort_id = ${req.params.id} AND user_id = ${req.params.userId}
        `;
        res.json({ success: true, message: 'Instructor removed from cohort.' });
    } catch (err) { next(err); }
});

export default router;
