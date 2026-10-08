import Database from "better-sqlite3";
import mysql from "mysql2/promise";

const sqlite = new Database("chemistryWebsite.db");

const mysqlDb = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "102910",
  database: "chemistry_website"
});

console.log("Connected to MySQL.");

const resources = sqlite
  .prepare("SELECT * FROM resources")
  .all();

const videos = sqlite
  .prepare("SELECT * FROM videos")
  .all();

const queries = sqlite
  .prepare("SELECT * FROM queries")
  .all();

console.log(`SQLite resources: ${resources.length}`);
console.log(`SQLite videos: ${videos.length}`);
console.log(`SQLite queries: ${queries.length}`);

for (const resource of resources) {
  await mysqlDb.execute(
    `INSERT INTO resources
    (id, title, class, chapter, description, file_path, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      resource.id,
      resource.title,
      resource.class,
      resource.chapter,
      resource.description,
      resource.file_path,
      resource.created_at
    ]
  );
}

for (const video of videos) {
  await mysqlDb.execute(
    `INSERT INTO videos
    (id, title, class, chapter, description, file_path,
     thumbnail_path, duration, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      video.id,
      video.title,
      video.class,
      video.chapter,
      video.description,
      video.file_path,
      video.thumbnail_path,
      video.duration,
      video.created_at
    ]
  );
}

for (const query of queries) {
  await mysqlDb.execute(
    `INSERT INTO queries
    (id, name, email, subject, message, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      query.id,
      query.name,
      query.email,
      query.subject,
      query.message,
      query.created_at
    ]
  );
}

console.log("Migration completed.");

await mysqlDb.end();
sqlite.close();