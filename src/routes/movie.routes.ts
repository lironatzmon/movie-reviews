import { Router } from 'express';
import * as movieController from '../controllers/movie.controller';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { idParamsSchema } from '../validators/common.validator';
import {
  createMovieSchema,
  listMoviesQuerySchema,
  updateMovieSchema,
} from '../validators/movie.validator';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     MovieInput:
 *       type: object
 *       required: [title, releaseYear, genres, director]
 *       properties:
 *         title: { type: string, example: Inception }
 *         releaseYear: { type: integer, minimum: 1888, example: 2010 }
 *         genres: { type: array, minItems: 1, items: { type: string }, example: [Sci-Fi] }
 *         director: { type: string, example: Christopher Nolan }
 *         actors: { type: array, items: { type: string } }
 *         description: { type: string }
 *     Movie:
 *       allOf:
 *         - $ref: '#/components/schemas/MovieInput'
 *         - type: object
 *           properties:
 *             id: { type: string }
 *             createdBy: { type: string }
 *             averageRating: { type: number, readOnly: true }
 *             reviewsCount: { type: integer, readOnly: true }
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 *   responses:
 *     MovieResponse:
 *       description: The movie
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               data: { $ref: '#/components/schemas/Movie' }
 */

/**
 * @openapi
 * /api/movies:
 *   get:
 *     tags: [Movies]
 *     summary: List movies
 *     parameters:
 *       - { in: query, name: search, schema: { type: string }, description: Title contains (case-insensitive) }
 *       - { in: query, name: genre, schema: { type: string } }
 *       - { in: query, name: year, schema: { type: integer } }
 *       - { in: query, name: director, schema: { type: string } }
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [rating, -rating, year, -year, title] }
 *     responses:
 *       200:
 *         description: A page of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Movie' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *   post:
 *     tags: [Movies]
 *     summary: Create a movie
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MovieInput' }
 *     responses:
 *       201: { $ref: '#/components/responses/MovieResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router
  .route('/')
  .get(validate({ query: listMoviesQuerySchema }), movieController.listMovies)
  .post(authenticate, validate({ body: createMovieSchema }), movieController.createMovie);

/**
 * @openapi
 * /api/movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Get a movie (includes averageRating and reviewsCount)
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     responses:
 *       200: { $ref: '#/components/responses/MovieResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Movies]
 *     summary: Update a movie (owner or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ $ref: '#/components/parameters/IdParam' }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MovieInput' }
 *     responses:
 *       200: { $ref: '#/components/responses/MovieResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Movies]
 *     summary: Delete a movie and its reviews (owner or admin)
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
  .route('/:id')
  .all(validate({ params: idParamsSchema }))
  .get(movieController.getMovie)
  .put(authenticate, validate({ body: updateMovieSchema }), movieController.updateMovie)
  .delete(authenticate, movieController.deleteMovie);

export default router;
