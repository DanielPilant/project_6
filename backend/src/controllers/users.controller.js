// =============================================================================
// controllers/users.controller.js
// -----------------------------------------------------------------------------
// The controller layer owns the HTTP concerns: read req params/body, do light
// validation, call the DAL (service), and send the right status code + JSON.
// It contains NO raw SQL. Errors are forwarded to the central error handler
// via `next(err)`.
//
// Status codes used here:
//   200 OK            - successful GET / PUT / DELETE
//   201 Created       - successful POST
//   400 Bad Request   - missing required fields
//   404 Not Found     - id does not exist
//   500 Internal      - unexpected error (handled by middleware)
// =============================================================================

const usersService = require("../services/users.service");

// GET /users
async function getAllUsers(req, res, next) {
  try {
    const users = await usersService.findAll();
    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
}

// GET /users/:id
async function getUserById(req, res, next) {
  try {
    const user = await usersService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/todos
async function getUserTodos(req, res, next) {
  try {
    const user = await usersService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const todos = await usersService.findTodosByUserId(req.params.id);
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/posts
async function getUserPosts(req, res, next) {
  try {
    const user = await usersService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const posts = await usersService.findPostsByUserId(req.params.id);
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
}

// GET /users/:id/albums
async function getUserAlbums(req, res, next) {
  try {
    const user = await usersService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const albums = await usersService.findAlbumsByUserId(req.params.id);
    res.status(200).json(albums);
  } catch (err) {
    next(err);
  }
}

// POST /users
async function createUser(req, res, next) {
  try {
    const { name, username, email } = req.body;
    if (!name || !username || !email) {
      return res
        .status(400)
        .json({ message: "Fields 'name', 'username' and 'email' are required" });
    }
    const newUser = await usersService.create(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
}

// PUT /users/:id
async function updateUser(req, res, next) {
  try {
    const { name, username, email } = req.body;
    if (!name || !username || !email) {
      return res
        .status(400)
        .json({ message: "Fields 'name', 'username' and 'email' are required" });
    }
    const updated = await usersService.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /users/:id
async function deleteUser(req, res, next) {
  try {
    const deleted = await usersService.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserTodos,
  getUserPosts,
  getUserAlbums,
  createUser,
  updateUser,
  deleteUser,
};
