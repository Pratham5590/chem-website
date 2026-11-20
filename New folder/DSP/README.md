# DSP Chemistry Website

Public educational website built with HTML, CSS, vanilla JavaScript, Node.js,
Express, and Neon PostgreSQL.

## Stack

- Frontend: existing HTML, CSS, and vanilla JavaScript
- Backend: Node.js 22 and Express 5
- Database: Neon PostgreSQL (`@neondatabase/serverless`)
- Hosting: Vercel

## Local development

1. Install Node.js 22.
2. Run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `DATABASE_URL` to your Neon pooled connection string.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.

## Database setup and migration

1. Run `info.sql` in the Neon SQL Editor.
2. Configure the local MySQL and Neon variables in `.env`.
3. Run `npm run migrate:mysql-to-neon`.
4. See `MIGRATION-MYSQL-TO-NEON.md` for the full procedure.

## Vercel deployment

Add `DATABASE_URL` in Vercel Project Settings -> Environment Variables.
Use Neon's pooled connection string (hostname includes `-pooler`) and redeploy.

## Public endpoints

- `GET /healthz`
- `GET /getResources`
- `GET /getVideos`
- `POST /queries`

The admin dashboard and content-management endpoints have been disabled.
The HTML and CSS files have been preserved without edits.
