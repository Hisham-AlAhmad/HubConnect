/**
 * Organizations routes
 * GET  /api/organizations
 * GET  /api/organizations/:id
 * POST /api/organizations        (admin)
 * PUT  /api/organizations/:id    (admin)
 * GET  /api/organizations/:id/users (admin)
 */
import { Router } from 'express';
import { body } from 'express-validator';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res, next) => {
    try {
        const orgs = await sql`SELECT * FROM organizations ORDER BY created_at DESC`;
        res.json({ success: true, data: orgs });
    } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
    try {
        const [org] = await sql`SELECT * FROM organizations WHERE id = ${req.params.id}`;
        if (!org) return res.status(404).json({ success: false, error: 'Organization not found.' });
        res.json({ success: true, data: org });
    } catch (err) { next(err); }
});

router.post(
    '/',
    authorize('admin'),
    [
        body('name').trim().notEmpty(),
        body('slug').trim().matches(/^[a-z0-9-]{3,}$/).withMessage('Slug must be lowercase letters, numbers, hyphens, min 3 chars'),
    ],
    validate,
    async (req, res, next) => {
        try {
            const { name, slug, description, logoUrl } = req.body;
            const [org] = await sql`
                INSERT INTO organizations (name, slug, description, logo_url)
                VALUES (${name}, ${slug}, ${description ?? null}, ${logoUrl ?? null})
                RETURNING *
            `;
            res.status(201).json({ success: true, data: org });
        } catch (err) {
            if (err.code === '23505') return res.status(409).json({ success: false, error: 'Organization slug already exists.' });
            next(err);
        }
    }
);

router.put(
    '/:id',
    authorize('admin'),
    [body('name').optional().trim().notEmpty()],
    validate,
    async (req, res, next) => {
        try {
            const { name, description, logoUrl } = req.body;
            const [org] = await sql`
                UPDATE organizations
                SET name        = COALESCE(${name        ?? null}, name),
                    description = COALESCE(${description ?? null}, description),
                    logo_url    = COALESCE(${logoUrl     ?? null}, logo_url),
                    updated_at  = CURRENT_TIMESTAMP
                WHERE id = ${req.params.id} RETURNING *
            `;
            if (!org) return res.status(404).json({ success: false, error: 'Organization not found.' });
            res.json({ success: true, data: org });
        } catch (err) { next(err); }
    }
);

router.get('/:id/users', authorize('admin'), async (req, res, next) => {
    try {
        const users = await sql`
            SELECT p.id, p.email, p.role, p.full_name, p.avatar_url, ou.joined_at
            FROM organization_users ou
            JOIN profiles p ON p.id = ou.user_id
            WHERE ou.organization_id = ${req.params.id}
            ORDER BY p.full_name
        `;
        res.json({ success: true, data: users });
    } catch (err) { next(err); }
});

export default router;
