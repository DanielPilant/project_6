// =============================================================================
// controllers/todos.controller.js
// -----------------------------------------------------------------------------
// HTTP layer for the todos resource. No SQL here.
// =============================================================================

const todosService = require("../services/todos.service");

// GET /todos
async function getAllTodos(req, res, next) {
  try {
    const todos = await todosService.findAll();
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
}

// GET /todos/:id
async function getTodoById(req, res, next) {
  try {
    const todo = await todosService.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

// POST /todos
async function createTodo(req, res, next) {
  try {
    const { user_id, title } = req.body;
    if (!user_id || !title) {
      return res
        .status(400)
        .json({ message: "Fields 'user_id' and 'title' are required" });
    }
    const newTodo = await todosService.create(req.body);
    res.status(201).json(newTodo);
  } catch (err) {
    next(err);
  }
}

// PUT /todos/:id
async function updateTodo(req, res, next) {
  try {
    const { user_id, title } = req.body;
    if (!user_id || !title) {
      return res
        .status(400)
        .json({ message: "Fields 'user_id' and 'title' are required" });
    }
    const updated = await todosService.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /todos/:id
async function deleteTodo(req, res, next) {
  try {
    const deleted = await todosService.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.status(200).json({ message: "Todo deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
