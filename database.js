import Database from "better-sqlite3";

const db = new Database("chemistryWebsite.db");
db.exec(`CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  class INTEGER NOT NULL,
  chapter TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  created_at TEXT CURRENT_TIMESTAMP);`);
db.exec(`CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  class INTEGER NOT NULL,
  chapter TEXT,
  description TEXT,
  file_path TEXT NOT NULL,
  thumbnail_path TEXT,
  duration TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP);`);

db.exec(`CREATE TABLE IF NOT EXISTS queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);`);

export function getResources() {
  const statement = db.prepare(`SELECT * FROM resources`);
  let resources = statement.all();
  return resources
}

export function getVideos() {
  const statement = db.prepare(`SELECT * FROM videos`);
  let videos = statement.all();
  return videos;
}

export function addQuery(name, email, subject, message) {
  const statement = db.prepare(`
    INSERT INTO queries (name, email, subject, message)
    VALUES (?, ?, ?, ?)
  `);

  return statement.run(name, email, subject, message);
}