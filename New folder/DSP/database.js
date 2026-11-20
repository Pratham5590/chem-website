import { neon } from "@neondatabase/serverless";

let sqlClient;

function getSql() {
  if (sqlClient) return sqlClient;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const error = new Error("DATABASE_URL is not configured.");
    error.code = "DB_CONFIG_MISSING";
    throw error;
  }

  sqlClient = neon(connectionString);
  return sqlClient;
}

export async function getResources() {
  return getSql()`
    SELECT
      id, title, "class", chapter, description, type, file_path, created_at
    FROM resources
    ORDER BY created_at DESC NULLS LAST, id DESC
  `;
}

export async function getVideos() {
  return getSql()`
    SELECT
      id, title, "class", chapter, description,
      file_path, thumbnail_path, duration, created_at
    FROM videos
    ORDER BY created_at DESC NULLS LAST, id DESC
  `;
}

export async function addQuery(data) {
  const rows = await getSql()`
    INSERT INTO queries (name, email, subject, message)
    VALUES (${data.name}, ${data.email}, ${data.subject}, ${data.message})
    RETURNING id
  `;
  return rows[0]?.id ?? null;
}

export async function testDatabaseConnection() {
  const rows = await getSql()`SELECT 1 AS connected`;
  return Number(rows[0]?.connected) === 1;
}
