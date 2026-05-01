# AGENTS.md

Context for agents working on this codebase. Developers should use README.md instead.

## Project overview

Express.js REST API for an inspection management system (DataField). Handles reviews, PDF/Excel report generation, photo uploads to Cloudinary, and email delivery via Resend.

## Key files

- `app.js` — Express entry point, middleware setup, error handler
- `controller.js` — All route handlers. **All catch blocks must call `next(err)`** so morgan logs errors and the error handler runs
- `route.js` — Route definitions
- `services/form.service.js` — Review data fetching, PDF/Excel generation
- `services/email.service.js` — Resend email delivery
- `services/review.service.js` — Additional review logic
- `config/db.js` — PostgreSQL pool (`pool.connect()` for transactions)
- `config/consts.js` — Env vars and config objects

## Error handling

Morgan logs all HTTP requests including 500 errors when controllers pass errors to `next(err)`. All controllers catch errors and call `next(err)`.

**Critical rule**: Every catch block must call `next(err)` — never swallow errors or only return a response. The error handler at `app.js:29` runs after morgan logs the request.

## Routing conventions

All routes mounted at `/api` (set in `app.js`). Route file uses `express.Router()`.
Status codes use 200 for success, 400 for bad input, 404 for not found, 500 for server errors.

## Database

PostgreSQL via `pg` (pool from `config/db.js`). Use parameterized queries (`$1, $2, ...`). Use `pool.connect()` for transactions with BEGIN/COMMIT/ROLLBACK.

## Important conventions

- **Spanish field names** in DB (e.g. `normativa_asme_b313`), camelCase in JS API responses
- Status mapping: `abierta` → `open`, `cerrada` → `closed`, `observada` → `viewed`
- Review `project_id` and `created_by` are hardcoded to `1` in `createReview`
- Photos stored on Cloudinary (URL in DB), not local filesystem
- Multer configured for memory storage, max 5MB per file, up to 6 photos per request
- PDF uses `pdfkit`, Excel uses `exceljs`

## Commands

```bash
npm start        # Run with --watch
```

No test, lint, or typecheck scripts defined. Verify changes manually or add scripts as needed.
