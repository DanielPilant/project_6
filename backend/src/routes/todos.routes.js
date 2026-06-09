// =============================================================================
// routes/todos.routes.js
// -----------------------------------------------------------------------------
// Endpoint wiring for the todos resource.
// =============================================================================

const express = require("express");
const router = express.Router();
const todosController = require("../controllers/todos.controller");

// Collection
router.get("/", todosController.getAllTodos);
router.post("/", todosController.createTodo);

// Single item
router.get("/:id", todosController.getTodoById);
router.put("/:id", todosController.updateTodo);
router.delete("/:id", todosController.deleteTodo);

module.exports = router;
