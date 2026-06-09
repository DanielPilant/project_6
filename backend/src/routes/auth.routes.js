// =============================================================================
// routes/auth.routes.js
// -----------------------------------------------------------------------------
// Endpoint wiring for authentication. Mounted at the app root so the paths are
// POST /login and POST /register (no resource prefix).
// =============================================================================

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
