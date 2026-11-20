# MySQL to Neon PostgreSQL migration

The application now uses Neon's serverless PostgreSQL driver. Vercel reads the
pooled connection string from `DATABASE_URL`.

## 1. Create the Neon database

1. Create a project in the Neon Console.
2. Select the database and role you want to use.
3. Open **Connect** and copy the pooled connection string (hostname includes
   `-pooler`) for the application's `DATABASE_URL`.
4. Copy the direct connection string (hostname does not include `-pooler`) for
   the one-time migration script's `DIRECT_URL`.
5. Add only `DATABASE_URL` to Vercel Project Settings -> Environment Variables.
6. Put the source MySQL values and both Neon URLs in a local `.env` file.
   Never commit `.env` or share the connection strings.

## 2. Create the PostgreSQL tables

Open the Neon SQL Editor and run the contents of `info.sql` first.

This creates `resources`, `videos`, and `queries` with PostgreSQL identity
columns and the same application fields as the former MySQL schema.

## 3. Install local migration dependencies

In the project folder, run:

```bash
npm install
```

The migration utility uses `mysql2` and `pg` as development dependencies.
They are not used by the deployed website.

## 4. Configure the local `.env`

Copy `.env.example` to `.env` and fill in:

- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
  for the existing MySQL database.
- `DIRECT_URL` with Neon's direct (non-pooler) connection string.
- `DATABASE_URL` with Neon's pooled connection string.

The MySQL database must be reachable from the computer running the migration.
For a MySQL server running on this same computer, `MYSQL_HOST=127.0.0.1`
is usually appropriate.

## 5. Run the migration

```bash
npm run migrate:mysql-to-neon
```

The script copies all rows from `resources`, `videos`, and `queries`, preserving
their IDs and timestamps. It uses an upsert on each table's `id`, so rerunning
it updates matching IDs without deleting other rows from Neon. It also resets
the PostgreSQL identity sequences after each table.

Keep the old MySQL database intact until the migration has completed and you
have checked the row counts and site behaviour.

## 6. Deploy

1. Add the Neon pooled connection string as `DATABASE_URL` in Vercel.
2. Push the project to GitHub and deploy.
3. Test `/healthz`, `/getResources`, `/getVideos`, and the contact form.

`/healthz` confirms the app is responding. The data endpoints and contact form
confirm that the database is reachable.

## Important notes

- Use the pooled Neon URL for Vercel application traffic. Use the direct URL
  for the one-time migration.
- Existing uploaded files are not stored inside these database tables. Their
  `file_path` values are copied as-is; the files must still be available at
  those URLs or be moved to persistent object storage.
- The admin dashboard remains disabled, as requested earlier.
- HTML and CSS files are preserved without edits.
- Do not put credentials in source files, GitHub, screenshots, or chat.
