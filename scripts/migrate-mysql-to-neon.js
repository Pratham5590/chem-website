import "dotenv/config";
import mysql from "mysql2/promise";
import pg from "pg";

const { Client } = pg;

const required = [
  "MYSQL_HOST",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
  "DIRECT_URL"
];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  throw new Error(`Missing migration environment variables: ${missing.join(", ")}`);
}

const tables = {
  resources: [
    "id", "title", "class", "chapter", "description",
    "type", "file_path", "created_at"
  ],
  videos: [
    "id", "title", "class", "chapter", "description",
    "file_path", "thumbnail_path", "duration", "created_at"
  ],
  queries: [
    "id", "name", "email", "subject", "message", "created_at"
  ]
};

const mysqlConnection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectTimeout: 15000,
  dateStrings: false
});

const postgres = new Client({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: true },
  connectionTimeoutMillis: 15000
});

function quotePgIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function migrateTable(table, columns) {
  const mysqlColumns = columns.map((column) => `\`${column}\``).join(", ");
  const [rows] = await mysqlConnection.query(
    `SELECT ${mysqlColumns} FROM \`${table}\` ORDER BY \`id\``
  );

  if (!rows.length) {
    console.log(`${table}: no rows to migrate`);
    return 0;
  }

  const pgColumns = columns.map((column) =>
    column === "class" ? '"class"' : quotePgIdentifier(column)
  ).join(", ");
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const mutableColumns = columns.filter((column) => column !== "id");
  const updates = mutableColumns
    .map((column) => `${column === "class" ? '"class"' : quotePgIdentifier(column)} = EXCLUDED.${column === "class" ? '"class"' : quotePgIdentifier(column)}`)
    .join(", ");

  const statement = `
    INSERT INTO public.${quotePgIdentifier(table)} (${pgColumns})
    VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET ${updates}
  `;

  for (const row of rows) {
    const values = columns.map((column) => row[column] ?? null);
    await postgres.query(statement, values);
  }

  await postgres.query(`
    SELECT setval(
      pg_get_serial_sequence('public.${table}', 'id'),
      COALESCE((SELECT MAX(id) FROM public.${table}), 1),
      EXISTS (SELECT 1 FROM public.${table})
    )
  `);

  console.log(`${table}: migrated ${rows.length} rows`);
  return rows.length;
}

try {
  await postgres.connect();
  await postgres.query("SELECT 1");

  console.log("Connected to source MySQL and target Neon PostgreSQL.");
  console.log("Existing rows with matching IDs will be updated; other rows are preserved.");

  await postgres.query("BEGIN");
  let total = 0;

  try {
    for (const [table, columns] of Object.entries(tables)) {
      total += await migrateTable(table, columns);
    }
    await postgres.query("COMMIT");
  } catch (error) {
    await postgres.query("ROLLBACK");
    throw error;
  }

  console.log(`Migration completed. ${total} rows processed across ${Object.keys(tables).length} tables.`);
} finally {
  await Promise.allSettled([
    mysqlConnection.end(),
    postgres.end()
  ]);
}
