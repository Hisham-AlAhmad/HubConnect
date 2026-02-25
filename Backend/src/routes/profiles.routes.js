/**
 * Profiles routes
 * GET    /api/profiles          (admin/instructor)
 * GET    /api/profiles/:id
 * PUT    /api/profiles/:id
 * GET    /api/profiles/students  (admin/instructor)
 * GET    /api/profiles/instructors (admin)
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

/* GET /profiles — list all users (admin/instructor only) */
router.get('/', authorize('admin', 'instructor'), async (_req, res, next) => {
    try {
        const users = await sql`
            SELECT id, email, role, full_name, avatar_url, phone_number, bio
            FROM profiles
            ORDER BY full_name
        `;
        res.json({ success: true, data: users });
    } catch (err) { next(err); }
});

/* GET /profiles/students */
router.get('/students', authorize('admin', 'instructor'), async (_req, res, next) => {
    try {
        const students = await sql`
            SELECT p.id, p.email, p.role, p.full_name, p.avatar_url,
                   tm.team_id,
                   t.name  AS team_name,
                   uc.cohort_id,
                   c.name  AS cohort_name
            FROM profiles p
            LEFT JOIN team_members tm ON tm.user_id = p.id
            LEFT JOIN teams t         ON t.id = tm.team_id
            LEFT JOIN user_cohorts uc ON uc.user_id = p.id
            LEFT JOIN cohorts c       ON c.id = uc.cohort_id
            WHERE p.role IN ('student', 'team_leader')
            ORDER BY p.full_name
        `;
        res.json({ success: true, data: students });
    } catch (err) { next(err); }
});

/* GET /profiles/instructors */
router.get('/instructors', authorize('admin'), async (_req, res, next) => {
    try {
        const instructors = await sql`
            SELECT id, email, role, full_name, avatar_url
            FROM profiles
            WHERE role = 'instructor'
            ORDER BY full_name
        `;
        res.json({ success: true, data: instructors });
    } catch (err) { next(err); }
});

/* GET /profiles/:id */
router.get('/:id', async (req, res, next) => {
    try {
        const [user] = await sql`
            SELECT id, email, role, full_name, avatar_url, phone_number, bio
            FROM profiles
            WHERE id = ${req.params.id}
        `;
        if (!user) return res.status(404).json({ success: false, error: 'Profile not found.' });
        res.json({ success: true, data: user });
    } catch (err) { next(err); }
});

/* PUT /profiles/:id — own profile or admin */
router.put(
    '/:id',
    [body('full_name').optional().trim(), body('phone_number').optional().trim(), body('bio').optional().trim()],
    validate,
    async (req, res, next) => {
        try {
            if (req.user.id !== req.params.id && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, error: 'Forbidden.' });
            }
            const { full_name, phone_number, bio } = req.body;
            const [profile] = await sql`
                UPDATE profiles
                SET full_name    = COALESCE(${full_name    ?? null}, full_name),
                    phone_number = COALESCE(${phone_number ?? null}, phone_number),
                    bio          = COALESCE(${bio          ?? null}, bio),
                    updated_at   = CURRENT_TIMESTAMP
                WHERE id = ${req.params.id}
                RETURNING *
            `;
            res.json({ success: true, data: profile });
        } catch (err) { next(err); }
    }
);

export default router;
