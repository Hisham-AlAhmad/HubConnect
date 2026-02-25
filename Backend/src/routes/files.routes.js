/**
 * Files routes (metadata management — actual file storage via Supabase Storage or S3)
 * GET    /api/files
 * GET    /api/files/:id
 * POST   /api/files/upload     (multipart/form-data metadata recording)
 * DELETE /api/files/:id
 */
import { Router } from 'express';
import multer from 'multer';
import sql from '../db/index.js';
import authenticate from '../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

// Multer: memory storage — in production, stream directly to S3/Supabase
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/* GET /files?resourceType=&resourceId= */
router.get('/', async (req, res, next) => {
    try {
        const { resourceType, resourceId } = req.query;
        let files;
        if (resourceType && resourceId) {
            files = await sql`
                SELECT f.*, p.full_name AS uploaded_by_name
                FROM files f
                LEFT JOIN profiles p ON p.id = f.uploaded_by
                WHERE f.resource_type = ${resourceType} AND f.resource_id = ${resourceId}::uuid
                  AND f.deleted_at IS NULL
                ORDER BY f.created_at DESC
            `;
        } else {
            files = await sql`
                SELECT f.*, p.full_name AS uploaded_by_name
                FROM files f
                LEFT JOIN profiles p ON p.id = f.uploaded_by
                WHERE f.uploaded_by = ${req.user.id} AND f.deleted_at IS NULL
                ORDER BY f.created_at DESC
            `;
        }
        res.json({ success: true, data: files });
    } catch (err) { next(err); }
});

/* GET /files/:id */
router.get('/:id', async (req, res, next) => {
    try {
        const [file] = await sql`SELECT * FROM files WHERE id = ${req.params.id} AND deleted_at IS NULL`;
        if (!file) return res.status(404).json({ success: false, error: 'File not found.' });
        res.json({ success: true, data: file });
    } catch (err) { next(err); }
});

/* POST /files/upload — records file metadata. Actual upload handled client-side (Supabase/S3). */
router.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        const { bucketId, filePath, storageUrl, resourceType, resourceId, isPublic } = req.body;
        const organizationId = req.body.organizationId ?? req.user.organizationId;
        const file = req.file;
        if (!file && !storageUrl) {
            return res.status(400).json({ success: false, error: 'File or storageUrl required.' });
        }
        if (!organizationId) {
            return res.status(400).json({ success: false, error: 'organizationId required.' });
        }
        const [record] = await sql`
            INSERT INTO files (organization_id, bucket_id, file_path, file_name, file_size, mime_type, storage_url, uploaded_by, resource_type, resource_id, is_public)
            VALUES (
                ${organizationId},
                ${bucketId ?? 'default'},
                ${filePath ?? file?.originalname ?? 'unknown'},
                ${file?.originalname ?? filePath?.split('/').pop() ?? 'unknown'},
                ${file?.size ?? null},
                ${file?.mimetype ?? null},
                ${storageUrl ?? null},
                ${req.user.id},
                ${resourceType ?? null},
                ${resourceId ?? null}::uuid,
                ${isPublic === 'true' || isPublic === true}
            )
            RETURNING *
        `;
        res.status(201).json({ success: true, data: record });
    } catch (err) { next(err); }
});

/* DELETE /files/:id */
router.delete('/:id', async (req, res, next) => {
    try {
        const [file] = await sql`
            UPDATE files SET deleted_at = CURRENT_TIMESTAMP
            WHERE id = ${req.params.id} AND (uploaded_by = ${req.user.id} OR ${req.user.role} = 'admin')
            RETURNING id
        `;
        if (!file) return res.status(404).json({ success: false, error: 'File not found or access denied.' });
        res.json({ success: true, message: 'File deleted.' });
    } catch (err) { next(err); }
});

export default router;
