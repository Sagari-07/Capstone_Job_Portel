# Capstone Job Portal (Node + MySQL)

Minimal full-stack upgrade for the existing static capstone project. The UI remains the same, while the backend now supports authentication, job applications, and admin review workflows.

## Quick Start

```bash
npm install
cp env.sample .env   # update with your MySQL creds
# create database schema + seed accounts
mysql -u root -p < schema.sql
mysql -u root -p < seed.sql
npm start
```

## Default Accounts

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | Admin@123 |
| User  | student  | User@123  |

## Folder Highlights

- `server.js` – Express app, sessions, protected static routes.
- `config/db.js` – mysql2 pool using `.env` variables.
- `routes/*` – Auth + job application APIs.
- `middleware/auth.js` – Role guards.
- `uploads/` – Stored resumes (served via `/uploads`).
- `schema.sql` / `seed.sql` – Database bootstrap scripts.

## Feature Overview

- Users can apply to any job (resume upload validated + stored).
- “Applied Jobs” page shows a user’s submissions (requires login).
- Admin dashboard lists all submissions with resume links.
- Session-based auth with bcryptjs password hashing.

