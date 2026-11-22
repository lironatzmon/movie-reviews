import { Router } from 'express';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is up
 */
router.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
