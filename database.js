import Database from "better-sqlite3";

const db = new Database("chemistryWebsite.db");
db.exec(`CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  class INTEGER NOT NULL,
  chapter TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  created_at TEXT CURRENT_TIMESTAMP);`)

export function getResources() {
  const statement = db.prepare(`SELECT * FROM resources`);
  let resources = statement.all();
  return resources
}