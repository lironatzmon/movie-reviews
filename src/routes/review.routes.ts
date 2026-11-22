import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { idParamsSchema, paginationQuerySchema } from '../validators/common.validator';
import {
  createReviewSchema,
  listReviewsParamsSchema,
  updateReviewSchema,
} from '../validators/review.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ReviewInput:
 *       type: object
 *       required: [rating, text]
 *       properties:
 *         rating: { type: number, minimum: 1, maximum: 10, multipleOf: 0.5, example: 8.5 }
 *         text: { type: string, minLength: 1, maxLength: 2000, example: Loved it }
 *     Review:
 *       allOf:
 *         - $ref: '#/components/schemas/ReviewInput'
 *         - type: object
 *           properties:
 *             id: { type: string }
 *             movie: { type: string }
 *             user: { type: string }
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 *   parameters:
 *     ReviewMovieId:
 *       in: path
 *       name: movieId
 *       required: true
 *       schema: { type: string }
 *       description: Movie ObjectId
 *   responses:
 *     ReviewResponse:
 *       description: The review
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data: { $ref: '#/components/schemas/Review' }
 */

/**
 * @openapi
 * /api/movies/{movieId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews of a movie (newest first)
 *     parameters:
 *       - $ref: '#/components/parameters/ReviewMovieId'
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: A page of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Review' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     tags: [Reviews]
 *     summary: Review a movie (one review per user per movie)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/ReviewMovieId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewInput' }
 *     responses:
 *       201: { $ref: '#/components/responses/ReviewResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409:
 *         description: Already reviewed
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
 */
router
  .route('/movies/:movieId/reviews')
  .all(validate({ params: listReviewsParamsSchema }))
  .get(validate({ query: paginationQuerySchema }), reviewController.listReviews)
  .post(authenticate, validate({ body: createReviewSchema }), reviewController.createReview);

/**
 * @openapi
 * /api/movies/{id}/rating:
 *   get:
 *     tags: [Reviews]
 *     summary: Get a movie's average rating and review count
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200:
 *         description: Rating summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     averageRating: { type: number, example: 8.5 }
 *                     reviewsCount: { type: integer, example: 2 }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/movies/:id/rating',
  validate({ params: idParamsSchema }),
  reviewController.getMovieRating,
);

/**
 * @openapi
 * /api/reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Edit a review's rating or text (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewInput' }
 *     responses:
 *       200: { $ref: '#/components/responses/ReviewResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       204: { description: Deleted }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router
  .route('/reviews/:id')
  .all(validate({ params: idParamsSchema }))
  .put(authenticate, validate({ body: updateReviewSchema }), reviewController.updateReview)
  .delete(authenticate, reviewController.deleteReview);

export default router;
