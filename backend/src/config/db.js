// =============================================================================
// config/db.js — MySQL connection pool
// -----------------------------------------------------------------------------
// Creates ONE shared connection pool for the whole app using the
// `mysql2/promise` wrapper (so we can use async/await with raw SQL — no ORM).
//
// A pool (vs. a single connection) lets concurrent requests borrow/return
// connections instead of opening a fresh socket each time, and survives idle
// timeouts. Every DB service file imports this `pool` and calls `pool.query()`.
// =============================================================================

require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
});

// Optional startup check: log success or fail fast with a clear message.
async function assertConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  console.log(
    `[db] Connected to MySQL '${process.env.DB_NAME}' at ${process.env.DB_HOST}:${process.env.DB_PORT}`
  );
}

module.exports = { pool, assertConnection };
