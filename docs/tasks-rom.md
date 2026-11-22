# Tasks — Rom

Read `CLAUDE.md` first. Start only after the stage 1 infra is on `main`
(`src/middlewares/auth.ts` and `tests/helpers/db.ts` exist). Auth and Users are done: in
API/integration tests use `createUser()` / `createUser('admin')` from `tests/helpers/auth.ts` to get a real user + token.

## Task 1 — Movies (`feature/movies`)

Model `Movie`:

- `title` string, required, trimmed
- `releaseYear` number, required, 1888 to current year + 5
- `genres` string[], at least 1
- `director` string, required
- `actors` string[]
- `description` string
- `createdBy` ObjectId ref `User`, required (from `req.user.id`, never from the body)
- `averageRating` number, default 0 (read-only for clients)
- `reviewsCount` number, default 0 (read-only for clients)
- timestamps

Endpoints:

| Method | Path              | Auth                                                                                                                                                                     |
| ------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/movies`     | public. Query: `search` (title, case-insensitive), `genre`, `year`, `director`, `page` (1), `limit` (10, max 50), `sort` (`rating`, `-rating`, `year`, `-year`, `title`) |
| GET    | `/api/movies/:id` | public, includes `averageRating` and `reviewsCount`                                                                                                                      |
| POST   | `/api/movies`     | `authenticate`                                                                                                                                                           |
| PUT    | `/api/movies/:id` | owner or admin                                                                                                                                                           |
| DELETE | `/api/movies/:id` | owner or admin, also deletes the movie's reviews                                                                                                                         |

Files: `models/Movie.ts`, `validators/movie.validator.ts`, `services/movie.service.ts`,
`controllers/movie.controller.ts`, `routes/movie.routes.ts` (+ Swagger docs), tests in all 3 levels.
Invalid ObjectId → 400. Missing movie → 404.

## Task 2 — Reviews + rating (`feature/reviews`)

Model `Review`:

- `movie` ObjectId ref `Movie`, required
- `user` ObjectId ref `User`, required (from `req.user.id`)
- `rating` number, required, 1–10, multiple of 0.5
- `text` string, required, 1–2000 chars
- timestamps
- unique index `{ movie: 1, user: 1 }`: one review per user per movie, duplicate → 409

Endpoints:

| Method | Path                           | Auth                                                 |
| ------ | ------------------------------ | ---------------------------------------------------- |
| GET    | `/api/movies/:movieId/reviews` | public, paginated, newest first                      |
| POST   | `/api/movies/:movieId/reviews` | `authenticate`, movie must exist (404)               |
| PUT    | `/api/reviews/:id`             | owner or admin (only `rating`, `text`)               |
| DELETE | `/api/reviews/:id`             | owner or admin                                       |
| GET    | `/api/movies/:id/rating`       | public → `{ data: { averageRating, reviewsCount } }` |

Rating: after every create/update/delete of a review, recalculate with an aggregation
(`$avg`, `$sum`) and save `averageRating` (rounded to 1 decimal) and `reviewsCount` on the movie.
No reviews → 0 and 0. Put this in one function `recalculateMovieRating(movieId)` in the review service.

Must-have tests: average updates after create/edit/delete, 8.5 accepted, 8.3 and 11 rejected,
duplicate review → 409, other user can't edit → 403, admin can, deleting a movie removes its reviews.

## Done =

`npm test` + `npm run lint` pass, Swagger documents every endpoint, PR opened to `main`.
