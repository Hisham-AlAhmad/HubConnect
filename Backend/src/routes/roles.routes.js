/**
 * Roles routes
 * GET  /api/roles
 * POST /api/roles           (admin)
 * PUT  /api/roles/:id       (admin)
 * DELETE /api/roles/:id     (admin)
 * GET  /api/roles/user/:userId
 * POST /api/roles/assign    (admin)
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
        const roles = await sql`SELECT * FROM roles ORDER BY name`;
        res.json({ success: true, data: roles });
    } catch (err) { next(err); }
});

router.post(
    '/',
    authorize('admin'),
    [body('name').trim().notEmpty(), body('organizationId').isUUID()],
    validate,
    async (req, res, next) => {
        try {
            const { name, organizationId } = req.body;
            const [role] = await sql`
                INSERT INTO roles (organization_id, name)
                VALUES (${organizationId}, ${name})
                ON CONFLICT (organization_id, name) DO NOTHING
                RETURNING *
            `;
            if (!role) return res.status(409).json({ success: false, error: 'Role already exists.' });
            res.status(201).json({ success: true, data: role });
        } catch (err) { next(err); }
    }
);

router.put('/:id', authorize('admin'), [body('name').trim().notEmpty()], validate, async (req, res, next) => {
    try {
        const [role] = await sql`UPDATE roles SET name = ${req.body.name} WHERE id = ${req.params.id} AND is_system_role = false RETURNING *`;
        if (!role) return res.status(404).json({ success: false, error: 'Role not found or is a system role.' });
        res.json({ success: true, data: role });
    } catch (err) { next(err); }
});

router.delete('/:id', authorize('admin'), async (req, res, next) => {
    try {
        const result = await sql`DELETE FROM roles WHERE id = ${req.params.id} AND is_system_role = false RETURNING id`;
        if (!result.length) return res.status(404).json({ success: false, error: 'Role not found or is a system role.' });
        res.json({ success: true, message: 'Role deleted.' });
    } catch (err) { next(err); }
});

router.get('/user/:userId', async (req, res, next) => {
    try {
        const roles = await sql`
            SELECT r.*, ur.assigned_at
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = ${req.params.userId}
        `;
        res.json({ success: true, data: roles });
    } catch (err) { next(err); }
});

router.post(
    '/assign',
    authorize('admin'),
    [body('userId').isUUID(), body('roleId').isUUID(), body('organizationId').isUUID()],
    validate,
    async (req, res, next) => {
        try {
            const { userId, roleId, organizationId } = req.body;

            // Update profiles.role to match the role name for quick JWT reads
            const [role] = await sql`SELECT name FROM roles WHERE id = ${roleId}`;
            if (!role) return res.status(404).json({ success: false, error: 'Role not found.' });
            await sql`UPDATE profiles SET role = ${role.name} WHERE id = ${userId}`;

            const [assignment] = await sql`
                INSERT INTO user_roles (organization_id, user_id, role_id)
                VALUES (${organizationId}, ${userId}, ${roleId})
                ON CONFLICT (organization_id, user_id, role_id) DO NOTHING
                RETURNING *
            `;
            res.status(201).json({ success: true, data: assignment });
        } catch (err) { next(err); }
    }
);

export default router;
