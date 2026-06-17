// =============================================================================
// tests/api.test.js — integration tests (Node's built-in test runner)
// -----------------------------------------------------------------------------
// Run with `npm test` (which runs `node --test`). Uses supertest to call the
// Express `app` IN-PROCESS — no server is started and no port is bound, because
// app.js is kept separate from server.js. A live MySQL (seeded from init.sql)
// must be reachable via the DB_* env vars (locally that comes from .env; in CI
// the workflow sets them).
// =============================================================================

const { test, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");

const app = require("../src/app");
const { pool } = require("../src/config/db");

// The DB connection pool keeps the process alive; close it once all tests are
// done so the test runner can exit cleanly.
after(async () => {
  await pool.end();
});

test("GET / returns the health payload", async () => {
  const res = await request(app).get("/");
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, "ok");
});

test("GET /users returns a non-empty array of users", async () => {
  const res = await request(app).get("/users");
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1, "expected at least one seeded user");
});

test("GET /users/1/todos returns an array (nested resource)", async () => {
  const res = await request(app).get("/users/1/todos");
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body));
});

test("POST /login with correct credentials returns the user and no password hash", async () => {
  const res = await request(app)
    .post("/login")
    .send({ username: "bret", password: "password123" });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.username, "bret");
  // Security: the password hash must never be returned to the client.
  assert.strictEqual(res.body.password_hash, undefined);
});

test("POST /login with bad credentials is rejected with 401", async () => {
  // Uses an unknown username so no real account's failed-attempt counter is touched.
  const res = await request(app)
    .post("/login")
    .send({ username: "no-such-user", password: "whatever" });
  assert.strictEqual(res.status, 401);
});
