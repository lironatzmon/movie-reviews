# Movie Reviews API — shared rules for everyone working on this repo

Pair project (Liron + Rom). Assignment: REST API for movies and reviews.
Stack: Node.js, Express 5, TypeScript, MongoDB (Mongoose 8), JWT, Zod 4, Swagger, Jest + Supertest.
Mongoose stays on v8: v9 (driver 7) fails to connect inside Jest.

## Working style

- Be token-efficient: no long explanations, no re-reading files you already know, no unrequested refactors.
- If something fails and you can't fix it in 2 tries, stop and tell the user what's blocked.
- Clean, readable code. Small functions. No dead code, no commented-out code.

## Architecture (strict layering)

`routes → controllers → services → models`

- `routes/`: endpoints + middlewares + Swagger JSDoc (`@openapi`). No logic.
- `controllers/`: read `req`, call service, send response. No Mongoose calls.
- `services/`: all business logic + DB access. Throw `AppError` on failure.
- `models/`: Mongoose schemas only.
- `validators/`: Zod schemas, used through `validate()` middleware.

## Shared building blocks (created in stage 1, don't duplicate)

- `src/utils/AppError.ts` — `new AppError(statusCode, message)`
- Express 5: async controllers can just `throw` / reject — errors reach `errorHandler` automatically (no asyncHandler).
- `src/middlewares/validate.ts` — `validate({ body?, params?, query? })` with Zod schemas
- `src/middlewares/errorHandler.ts` — the only place that formats errors
- `src/utils/jwt.ts` — `signToken({ id, role })`, `verifyToken(token)`
- `src/middlewares/auth.ts` — `authenticate` (verifies JWT, loads the user from DB, sets `req.user = { id, role }`; deleted user → 401), `authorize(...roles)`
- `src/validators/common.validator.ts` — `objectIdSchema`, `idParamsSchema`, `paginationQuerySchema`
- `src/models/toJSON.ts` — `toJSONOptions`: pass as `toJSON` option in every schema (`id` not `_id`, no `__v`)
- `src/types/auth.ts` — `Role`, `AuthUser`, `ROLES`
- `src/utils/pagination.ts` — `skipFor(query)`, `pageMeta(query, total)` for list endpoints
- Swagger shared components (in `user.routes.ts`): parameters `IdParam`, `PageParam`, `LimitParam`; schema `Pagination`; responses `BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`
- `tests/helpers/auth.ts` — `createUser(role?)` → `{ id, email, role, token }` (real user in the test DB)
- `tests/helpers/http.ts` — `mockRequest`, `mockResponse` for unit tests
- `tests/helpers/db.ts` — in-memory MongoDB (`connect`, `clear`, `close`) for integration/API tests

## Conventions

- Response: success `{ data }`; lists `{ data, pagination: { page, limit, total } }`; error `{ error: { message, details? } }`.
- Status codes: 200, 201 create, 204 delete, 400 validation, 401 no/invalid token, 403 not allowed, 404 not found, 409 duplicate.
- Ownership: owner or `admin` may edit/delete. Check it in the service.
- Roles: `user`, `admin`.
- Rating: 1 to 10, steps of 0.5 (8.5 ok, 8.3 rejected).
- Routes are mounted under `/api` in `src/app.ts`.

## Tests (TDD)

- Write the failing test first, then the code. Commit `test: ...` before `feat: ...`.
- `tests/unit` (mocks), `tests/integration` (services + in-memory DB), `tests/api` (supertest on `app`).
- `npm test` and `npm run lint` must pass before every commit.

## Git

- Never commit to `main` directly. Branch `feature/<name>`, open a PR, the partner reviews.
- Conventional commits: `feat:`, `test:`, `fix:`, `docs:`, `chore:`, `refactor:`.
- Before starting: `git pull origin main`. Before a PR: rebase on `main`.
- Never commit `.env` or secrets.

## Ownership split

- **Liron**: stage 1 infra, Auth (register/login/me), Users admin, Swagger setup, README, CI.
- **Rom**: Movies, Reviews, rating calculation (see `docs/tasks-rom.md`).
