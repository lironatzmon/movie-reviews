import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { loginSchema, registerSchema } from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id: { type: string, example: 665f1c2e8b3e4a0012345678 }
 *         name: { type: string, example: Liron }
 *         email: { type: string, example: liron@example.com }
 *         role: { type: string, enum: [user, admin] }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     AuthResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: object
 *           properties:
 *             user: { $ref: '#/components/schemas/User' }
 *             token: { type: string }
 */

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user (role is always "user")
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 50, example: Liron }
 *               email: { type: string, format: email, example: liron@example.com }
 *               password: { type: string, minLength: 8, example: secret123 }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { description: Validation failed, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       409: { description: Email already in use, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and get a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: liron@example.com }
 *               password: { type: string, example: secret123 }
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthResponse' }
 *       400: { description: Validation failed, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *       401: { description: Invalid email or password, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.post('/login', validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the logged-in user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/User' }
 *       401: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */
router.get('/me', authenticate, authController.me);

export default router;
