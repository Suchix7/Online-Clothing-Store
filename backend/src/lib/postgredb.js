// db.js
import pg from "pg";

if (!process.env.POSTGRE_URL) {
  console.error("Missing POSTGRE_URL env var");
  process.exit(1);
}

// log host only (to confirm it's Render, not localhost)
try {
  const u = new URL(process.env.POSTGRE_URL);
  console.log("DB host:", u.hostname); // should be dpg-d2kuaj3uibrs73elt460-a.oregon-postgres.render.com
} catch (e) {
  console.warn("POSTGRE_URL is not a valid URL");
}

export const pool = new pg.Pool({
  connectionString: process.env.POSTGRE_URL,
  ssl: { rejectUnauthorized: false }, // required for Render
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});
