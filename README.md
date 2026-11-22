# Movie Reviews API

REST API for managing movies and reviews.
Node.js, Express, TypeScript, MongoDB (Mongoose), JWT, Swagger.

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

## Scripts

| Script                  | Description                              |
| ----------------------- | ---------------------------------------- |
| `npm run dev`           | Run in development mode with auto-reload |
| `npm run build`         | Compile TypeScript to `dist/`            |
| `npm start`             | Run the compiled server                  |
| `npm test`              | Run all tests                            |
| `npm run test:coverage` | Run tests with coverage report           |
| `npm run lint`          | Lint the code                            |

## Design decisions

- Ratings are from 1 to 10 in steps of 0.5 (e.g. 8.5).
