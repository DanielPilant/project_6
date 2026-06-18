// =============================================================================
// controllers/admin.controller.js
// -----------------------------------------------------------------------------

const adminService = require("../services/admin.service");
const usersService = require("../services/users.service");
const authService = require("../services/auth.service");

const postsService = require("../services/posts.service");
const commentsService = require("../services/comments.service");
const todosService = require("../services/todos.service");
const albumsService = require("../services/albums.service");
const photosService = require("../services/photos.service");

// Registry of editable content resources: the service to use and which fields
// an admin may change. Other columns (ids, owners) are preserved.
const RESOURCES = {
  posts: { service: postsService, fields: ["title", "body"] },
  comments: { service: commentsService, fields: ["name", "email", "body"] },
  todos: { service: todosService, fields: ["title", "completed"] },
  albums: { service: albumsService, fields: ["title"] },
  photos: { service: photosService, fields: ["title", "url"] },
};

// GET /admin/data
async function getData(req, res, next) {
  try {
    const data = await adminService.getAllData();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

// PUT /admin/:resource/:id — edit any content item
async function updateResource(req, res, next) {
  try {
    const entry = RESOURCES[req.params.resource];
    if (!entry) {
      return res.status(404).json({ message: "Unknown resource" });
    }

    const existing = await entry.service.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Merge existing row with only the whitelisted editable fields from body,
    // so relationships/owners are preserved.
    const patch = {};
    for (const field of entry.fields) {
      if (req.body[field] !== undefined) patch[field] = req.body[field];
    }
    const merged = { ...existing, ...patch };

    const updated = await entry.service.update(req.params.id, merged);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /admin/:resource/:id — delete any content item
async function deleteResource(req, res, next) {
  try {
    const entry = RESOURCES[req.params.resource];
    if (!entry) {
      return res.status(404).json({ message: "Unknown resource" });
    }
    const ok = await entry.service.remove(req.params.id);
    if (!ok) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
}

// PUT /admin/users/:id/role  body: { admin_id, is_admin }
async function setUserRole(req, res, next) {
  try {
    const target = await usersService.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.is_super_admin) {
      return res
        .status(403)
        .json({ message: "The super admin's role cannot be changed" });
    }

    const isAdmin = req.body.is_admin ? 1 : 0;
    await adminService.setUserRole(req.params.id, isAdmin);
    res.status(200).json({
      message: isAdmin ? "User promoted to admin" : "User set to regular user",
    });
  } catch (err) {
    next(err);
  }
}

// PUT /admin/users/:id/block  body: { admin_id, blocked }
async function setUserBlocked(req, res, next) {
  try {
    const target = await usersService.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }
    if (target.is_super_admin) {
      return res
        .status(403)
        .json({ message: "The super admin cannot be blocked" });
    }

    const blocked = Boolean(req.body.blocked);
    await adminService.setUserBlocked(
      req.params.id,
      blocked,
      authService.MAX_FAILED_ATTEMPTS,
    );
    res
      .status(200)
      .json({ message: blocked ? "User blocked" : "User unblocked" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getData,
  updateResource,
  deleteResource,
  setUserRole,
  setUserBlocked,
};
