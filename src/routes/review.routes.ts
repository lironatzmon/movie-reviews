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
 *     ReviewId:
 *       in: path
 *       name: id
 *       required: true
 *       schema: { type: string }
 *       description: Review ObjectId
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
 *       - { in: query, name: page, schema: { type: integer, default: 1, minimum: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10, minimum: 1, maximum: 50 } }
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
 *       400: { $ref: '#/components/responses/ErrorResponse' }
 *       404: { $ref: '#/components/responses/ErrorResponse' }
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
 *       400: { $ref: '#/components/responses/ErrorResponse' }
 *       401: { $ref: '#/components/responses/ErrorResponse' }
 *       404: { $ref: '#/components/responses/ErrorResponse' }
 *       409: { $ref: '#/components/responses/ErrorResponse' }
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
 *     parameters: [{ $ref: '#/components/parameters/MovieId' }]
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
 *       400: { $ref: '#/components/responses/ErrorResponse' }
 *       404: { $ref: '#/components/responses/ErrorResponse' }
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
 *     parameters: [{ $ref: '#/components/parameters/ReviewId' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewInput' }
 *     responses:
 *       200: { $ref: '#/components/responses/ReviewResponse' }
 *       400: { $ref: '#/components/responses/ErrorResponse' }
 *       401: { $ref: '#/components/responses/ErrorResponse' }
 *       403: { $ref: '#/components/responses/ErrorResponse' }
 *       404: { $ref: '#/components/responses/ErrorResponse' }
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/ReviewId' }]
 *     responses:
 *       204: { description: Deleted }
 *       400: { $ref: '#/components/responses/ErrorResponse' }
 *       401: { $ref: '#/components/responses/ErrorResponse' }
 *       403: { $ref: '#/components/responses/ErrorResponse' }
 *       404: { $ref: '#/components/responses/ErrorResponse' }
 */
router
  .route('/reviews/:id')
  .all(validate({ params: idParamsSchema }))
  .put(authenticate, validate({ body: updateReviewSchema }), reviewController.updateReview)
  .delete(authenticate, reviewController.deleteReview);

export default router;
