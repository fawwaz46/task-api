# Task API

A small but **production-shaped** REST API: JWT authentication, per-user data
ownership, request validation, rate limiting, interactive OpenAPI docs, and a
real test suite.

![Node](https://img.shields.io/badge/Node-24-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000)
![Tests](https://img.shields.io/badge/tests-vitest-6E9F18)
![License](https://img.shields.io/badge/license-MIT-green)

---

## What it demonstrates

- **Auth done properly** — passwords hashed with bcrypt, stateless JWTs, an
  `Authorization: Bearer` middleware, and tighter rate limits on auth routes.
- **Data isolation** — every task is scoped to its owner; there's a test that
  proves users can't read each other's data.
- **Validation at the edge** — Zod schemas reject bad input with structured
  400s before anything touches the database.
- **Self-documenting** — Swagger UI served at `/docs`, spec at `/openapi.json`.
- **Testable architecture** — the app is a factory that accepts a DB, so tests
  run against an in-memory SQLite database.

## Run it

```bash
npm install
cp .env.example .env
npm run dev        # http://localhost:3000  ·  docs at /docs
npm test           # run the vitest suite
```

Or with Docker:

```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

## API

| Method | Route                | Auth | Description            |
|--------|----------------------|------|------------------------|
| POST   | `/api/auth/register` | —    | Create account, get JWT |
| POST   | `/api/auth/login`    | —    | Log in, get JWT        |
| GET    | `/api/tasks`         | ✔    | List your tasks        |
| POST   | `/api/tasks`         | ✔    | Create a task          |
| GET    | `/api/tasks/:id`     | ✔    | Get one task           |
| PATCH  | `/api/tasks/:id`     | ✔    | Update a task          |
| DELETE | `/api/tasks/:id`     | ✔    | Delete a task          |

### Example

```bash
# register
TOKEN=$(curl -s localhost:3000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"me@example.com","password":"supersecret"}' | jq -r .token)

# create a task
curl localhost:3000/api/tasks \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{"title":"Ship the portfolio","priority":"high"}'
```

## Project layout

```
src/
├── app.ts            # Express app factory (middleware, routers, docs)
├── server.ts         # entrypoint
├── db.ts             # SQLite + migrations
├── auth.ts           # JWT sign / verify middleware
├── validation.ts     # Zod schemas + validate() middleware
├── openapi.ts        # OpenAPI 3 spec (served at /docs)
└── routes/
    ├── auth.ts       # register / login
    └── tasks.ts      # task CRUD, owner-scoped
tests/
└── api.test.ts       # supertest integration tests
```

## License

MIT
