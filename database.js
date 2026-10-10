import "dotenv/config";
import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function getResources() {
  const [resources] = await db.query(`
    SELECT * FROM resources
  `);

  return resources;
}

export async function getVideos() {
  const [videos] = await db.query(`
    SELECT * FROM videos
  `);

  return videos;
}

export async function addQuery(name, email, subject, message) {
  const [result] = await db.execute(`
    INSERT INTO queries (name, email, subject, message)
    VALUES (?, ?, ?, ?)
  `, [
    name,
    email,
    subject,
    message
  ]);

  return result;
}

export async function getQueries() {
  const [queries] = await db.query(`
    SELECT id, name, email, subject, message, created_at
    FROM queries
    ORDER BY created_at DESC
  `);

  return queries;
}