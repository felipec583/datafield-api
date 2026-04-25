# Datafield API

Backend server for the Datafield inspection management system.

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run locally
npm start
```

## Environment Variables

Create a `.env` file in the `api` folder:

```
# Database connection (Neon or any PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Server port (optional, defaults to 3000)
PORT=3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Authenticate user |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/review` | Create new inspection |
| `GET` | `/api/review/:id` | Get inspection details |
| `PUT` | `/api/review/:id` | Update inspection |
| `DELETE` | `/api/review/:id` | Delete inspection |
| `POST` | `/api/review/:id/photos` | Upload photos |
| `GET` | `/api/reviews` | List all inspections |

## Project Structure

```
api/
├── app.js           # Express app entry point
├── controller.js    # Request handlers
├── route.js         # API routes
├── config/
│   └── consts.js    # Constants
├── models/          # SQL schemas
│   ├── project.sql
│   ├── member.sql
│   ├── review.sql
│   └── review_photos.sql
├── .env.example     # Environment template
└── package.json
```

## Features

- Email notification on new inspection
- PDF report generation
- Photo upload with multer
- PostgreSQL database
