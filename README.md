# Movie Reviews API

REST API for managing movies, reviews and ratings, with JWT authentication and role-based permissions.

**Stack:** Node.js 22 · Express 5 · TypeScript · MongoDB (Mongoose 8) · Zod · JWT · Swagger · Jest + Supertest

## Getting started

Requirements: Node.js 22+ and a running MongoDB (local or Atlas).

```bash
npm install
cp .env.example .env      # then edit the values
npm run seed              # optional: demo data
npm run dev
```

- API: http://localhost:3000/api
- Swagger UI: http://localhost:3000/api-docs (click **Authorize** and paste the token from login)
- OpenAPI JSON: http://localhost:3000/api-docs.json

### Environment variables

| Variable         | Description               | Example                                   |
| ---------------- | ------------------------- | ----------------------------------------- |
| `PORT`           | Server port               | `3000`                                    |
| `MONGO_URI`      | MongoDB connection string | `mongodb://localhost:27017/movie-reviews` |
| `JWT_SECRET`     | Secret for signing tokens | any long random string                    |
| `JWT_EXPIRES_IN` | Token lifetime            | `1d`                                      |

### Demo data

`npm run seed` **deletes** all users, movies and reviews and creates demo data:

| Role  | Email               | Password    |
| ----- | ------------------- | ----------- |
| admin | `admin@example.com` | `admin1234` |
| user  | `user@example.com`  | `user12345` |

## Scripts

| Script                            | Description                         |
| --------------------------------- | ----------------------------------- |
| `npm run dev`                     | Development server with auto-reload |
| `npm run build` / `npm start`     | Compile to `dist/` and run it       |
| `npm test`                        | All tests (unit, integration, API)  |
| `npm run test:coverage`           | Tests with coverage report          |
| `npm run lint` / `npm run format` | ESLint / Prettier                   |
| `npm run seed`                    | Reset the database with demo data   |

## API

All responses are JSON: `{ data }`, lists add `pagination: { page, limit, total }`,
errors are `{ error: { message, details? } }`.

| Method       | Path                           | Access                                                                  |
| ------------ | ------------------------------ | ----------------------------------------------------------------------- |
| POST         | `/api/auth/register`           | Public                                                                  |
| POST         | `/api/auth/login`              | Public                                                                  |
| GET          | `/api/auth/me`                 | Logged in                                                               |
| GET          | `/api/movies`                  | Public — `search`, `genre`, `year`, `director`, `page`, `limit`, `sort` |
| GET          | `/api/movies/:id`              | Public — includes `averageRating` and `reviewsCount`                    |
| POST         | `/api/movies`                  | Logged in                                                               |
| PUT / DELETE | `/api/movies/:id`              | Owner or admin                                                          |
| GET          | `/api/movies/:id/rating`       | Public                                                                  |
| GET          | `/api/movies/:movieId/reviews` | Public                                                                  |
| POST         | `/api/movies/:movieId/reviews` | Logged in                                                               |
| PUT / DELETE | `/api/reviews/:id`             | Owner or admin                                                          |
| GET          | `/api/users`                   | Admin                                                                   |
| GET / DELETE | `/api/users/:id`               | Admin                                                                   |
| PATCH        | `/api/users/:id/role`          | Admin                                                                   |
| GET          | `/health`                      | Public                                                                  |

Full request/response schemas are in Swagger.

## Design decisions

The assignment leaves several points open on purpose. This is what we decided:

- **Permissions.** Browsing movies and reviews is public. Creating requires login.
  Editing/deleting is allowed for the creator or an admin. User management is admin-only.
- **Ownership is stored.** Movies keep `createdBy` and reviews keep `user`, taken from the token, never from the body.
- **Roles.** `user` and `admin`. Registration always creates a `user`; clients cannot send a role.
  An admin cannot change their own role or delete themselves, so the system is never left without an admin.
- **Tokens reflect the current user.** Every authenticated request loads the user from the database,
  so a deleted user is rejected immediately and role changes apply without logging in again.
- **Ratings** are from 1 to 10 in steps of 0.5 (8.5 is valid, 8.3 is not).
- **One review per user per movie** (unique index, duplicate → 409).
- **Average rating** and **review count** are stored on the movie and recalculated with an aggregation
  after every review create/update/delete. Reads stay fast and the values are always consistent.
- **Cascading deletes.** Deleting a movie deletes its reviews. Deleting a user deletes their reviews
  and recalculates the ratings of the affected movies.
- **Security.** Passwords are hashed with bcrypt and never returned. `helmet` and `cors` are enabled.
  Input is validated with Zod; invalid ids return 400 instead of 500.

## Architecture

```
src/
├── config/        env + database connection
├── models/        Mongoose schemas
├── validators/    Zod schemas for body / params / query
├── services/      business logic and database access
├── controllers/   HTTP layer: read request, call service, send response
├── routes/        endpoints, middlewares and Swagger docs
├── middlewares/   authenticate, authorize, validate, errorHandler
├── utils/         AppError, JWT, pagination
├── docs/          Swagger setup
├── scripts/       seed
├── app.ts         Express app (no listen, used by tests)
└── server.ts      connects to MongoDB and starts the server
```

Requests flow `routes → controllers → services → models`. Errors are thrown as `AppError`
and formatted in a single error handler.

## Testing

Built with TDD: every feature started with a failing test (`test:` commit before `feat:` in the history).

| Level       | Folder              | What it covers                                  |
| ----------- | ------------------- | ----------------------------------------------- |
| Unit        | `tests/unit`        | Validators, services and middlewares with mocks |
| Integration | `tests/integration` | Services against an in-memory MongoDB           |
| API         | `tests/api`         | Full HTTP requests with Supertest               |

Tests use `mongodb-memory-server`, so no database setup is needed.
GitHub Actions runs lint, build and tests on every pull request.

## Team

Liron & Rom — infrastructure, auth and user management (Liron); movies, reviews and ratings (Rom).
Work was split into feature branches and merged through reviewed pull requests.
