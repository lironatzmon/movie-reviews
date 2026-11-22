import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { idParamsSchema, paginationQuerySchema } from '../validators/common.validator';
import { updateRoleSchema } from '../validators/user.validator';

const router = Router();

router.use(authenticate, authorize('admin'));

/**
 * @openapi
 * components:
 *   parameters:
 *     IdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema: { type: string, example: 665f1c2e8b3e4a0012345678 }
 *     PageParam:
 *       in: query
 *       name: page
 *       schema: { type: integer, minimum: 1, default: 1 }
 *     LimitParam:
 *       in: query
 *       name: limit
 *       schema: { type: integer, minimum: 1, maximum: 50, default: 10 }
 *   schemas:
 *     Pagination:
 *       type: object
 *       properties:
 *         page: { type: integer }
 *         limit: { type: integer }
 *         total: { type: integer }
 *   responses:
 *     BadRequest: { description: Validation failed, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *     Unauthorized: { description: Missing or invalid token, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *     Forbidden: { description: Not allowed, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 *     NotFound: { description: Not found, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
 */

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users (admin)]
 *     summary: List users, newest first
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Paginated users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', validate({ query: paginationQuerySchema }), userController.list);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users (admin)]
 *     summary: Get a user by id
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Users (admin)]
 *     summary: Delete a user (not yourself)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       204: { description: Deleted }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate({ params: idParamsSchema }), userController.getById);
router.delete('/:id', validate({ params: idParamsSchema }), userController.remove);

/**
 * @openapi
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Users (admin)]
 *     summary: Change a user's role (not your own)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role: { type: string, enum: [user, admin] }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  '/:id/role',
  validate({ params: idParamsSchema, body: updateRoleSchema }),
  userController.updateRole,
);

export default router;
