import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

/* ── Global middleware ─────────────────────────── */
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

/* ── Health check ──────────────────────────────── */
app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

/* ── API routes (/api/...) ─────────────────────── */
app.use('/api', routes);

/* ── Error handler (must be last) ──────────────── */
app.use(errorHandler);

/* ── Start server ──────────────────────────────── */
app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
});

export default app;
