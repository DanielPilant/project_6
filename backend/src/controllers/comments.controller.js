// =============================================================================
// controllers/comments.controller.js
// -----------------------------------------------------------------------------
// HTTP layer for the comments resource. No SQL here.
// =============================================================================

const commentsService = require("../services/comments.service");

// GET /comments
async function getAllComments(req, res, next) {
  try {
    const comments = await commentsService.findAll();
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

// GET /comments/:id
async function getCommentById(req, res, next) {
  try {
    const comment = await commentsService.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json(comment);
  } catch (err) {
    next(err);
  }
}

// POST /comments
async function createComment(req, res, next) {
  try {
    const { post_id, name, email, body } = req.body;
    if (!post_id || !name || !email || !body) {
      return res.status(400).json({
        message: "Fields 'post_id', 'name', 'email' and 'body' are required",
      });
    }
    const newComment = await commentsService.create(req.body);
    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
}

// PUT /comments/:id
async function updateComment(req, res, next) {
  try {
    const { post_id, name, email, body } = req.body;
    if (!post_id || !name || !email || !body) {
      return res.status(400).json({
        message: "Fields 'post_id', 'name', 'email' and 'body' are required",
      });
    }
    const updated = await commentsService.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /comments/:id
async function deleteComment(req, res, next) {
  try {
    const deleted = await commentsService.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found" });
    }
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
