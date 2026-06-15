// =============================================================================
// routes/users.routes.js
// -----------------------------------------------------------------------------
// Maps HTTP method + URL to a controller function. No logic lives here — routes
// are just the wiring. Nested resources (todos/posts of a user) are declared
// alongside the user routes. `:id` is the dynamic URL parameter.
// =============================================================================

const express = require("express");
const router = express.Router();
const usersController = require("../controllers/users.controller");

// Collection
router.get("/", usersController.getAllUsers);
router.post("/", usersController.createUser);

// Nested resources (declare BEFORE "/:id" is irrelevant here since paths differ,
// but keeping related reads grouped with the parent)
router.get("/:id/todos", usersController.getUserTodos);
router.get("/:id/posts", usersController.getUserPosts);
router.get("/:id/albums", usersController.getUserAlbums);

// Single item
router.get("/:id", usersController.getUserById);
router.put("/:id", usersController.updateUser);
router.delete("/:id", usersController.deleteUser);

module.exports = router;
