// =============================================================================
// server.js — Process entry point
// -----------------------------------------------------------------------------
// Verifies the DB connection, then starts the HTTP listener. Separating this
// from app.js keeps the app importable/testable without binding a port.
// =============================================================================

require("dotenv").config();
const app = require("./app");
const { assertConnection } = require("./config/db");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await assertConnection(); // fail fast if MySQL is unreachable
    app.listen(PORT, () => {
      console.log(`[server] API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("[server] Failed to start — could not connect to MySQL:");
    console.error(err.message);
    process.exit(1);
  }
}

start();
