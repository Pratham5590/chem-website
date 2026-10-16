import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "chemistry_website",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
});

export async function getResources() {
  const [rows] = await pool.query("SELECT * FROM resources ORDER BY created_at DESC, id DESC");
  return rows;
}

export async function getVideos() {
  const [rows] = await pool.query("SELECT * FROM videos ORDER BY created_at DESC, id DESC");
  return rows;
}

export async function addQuery(data) {
  const [result] = await pool.execute(
    "INSERT INTO queries (name, email, subject, message) VALUES (?, ?, ?, ?)",
    [String(data.name || "").trim(), String(data.email || "").trim(), String(data.subject || "").trim(), String(data.message || "").trim()]
  );
  return result.insertId;
}

export async function getQueries() {
  const [rows] = await pool.query("SELECT * FROM queries ORDER BY created_at DESC, id DESC");
  return rows;
}

export async function getAdminResources() {
  return getResources();
}

export async function createResource(data) {
  const [result] = await pool.execute(
    "INSERT INTO resources (title, `class`, chapter, description, type, file_path) VALUES (?, ?, ?, ?, ?, ?)",
    [data.title, data.class, data.chapter, data.description || "", data.type, data.file_path]
  );
  return result.insertId;
}

export async function updateResource(id, data) {
  const [result] = await pool.execute(
    "UPDATE resources SET title = ?, `class` = ?, chapter = ?, description = ?, type = ?, file_path = COALESCE(?, file_path) WHERE id = ?",
    [data.title, data.class, data.chapter, data.description || "", data.type, data.file_path ?? null, id]
  );
  return result.affectedRows;
}

export async function deleteResource(id) {
  const [result] = await pool.execute("DELETE FROM resources WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function getAdminVideos() {
  return getVideos();
}

export async function createVideo(data) {
  const [result] = await pool.execute(
    "INSERT INTO videos (title, `class`, chapter, description, file_path, thumbnail_path, duration) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [data.title, data.class, data.chapter, data.description || "", data.file_path, data.thumbnail_path ?? null, data.duration || ""]
  );
  return result.insertId;
}

export async function updateVideo(id, data) {
  const [result] = await pool.execute(
    "UPDATE videos SET title = ?, `class` = ?, chapter = ?, description = ?, file_path = COALESCE(?, file_path), thumbnail_path = COALESCE(?, thumbnail_path), duration = ? WHERE id = ?",
    [data.title, data.class, data.chapter, data.description || "", data.file_path ?? null, data.thumbnail_path ?? null, data.duration || "", id]
  );
  return result.affectedRows;
}

export async function deleteVideo(id) {
  const [result] = await pool.execute("DELETE FROM videos WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.query("SELECT 1");
    return true;
  } finally {
    connection.release();
  }
}

export default pool;
