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
router
  .route("/:id")
  .get(todosController.getTodoById)
  .put(todosController.updateTodo)
  .delete(todosController.deleteTodo);

module.exports = router;
