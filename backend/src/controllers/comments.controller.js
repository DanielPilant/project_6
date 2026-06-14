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
    const { post_id, user_id, name, email, body } = req.body;
    if (!post_id || !user_id || !name || !email || !body) {
      return res.status(400).json({
        message:
          "Fields 'post_id', 'user_id', 'name', 'email' and 'body' are required",
      });
    }
    const newComment = await commentsService.create(req.body);
    res.status(201).json(newComment);
  } catch (err) {
    next(err);
  }
}

// PUT /comments/:id — Stage E: only the comment's owner may update it.
async function updateComment(req, res, next) {
  try {
    const { user_id, name, email, body } = req.body;
    if (!user_id || !name || !email || !body) {
      return res.status(400).json({
        message: "Fields 'user_id', 'name', 'email' and 'body' are required",
      });
    }

    const existing = await commentsService.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Comment not found" });
    }
    // Ownership check: acting user (user_id) must be the comment's owner.
    if (existing.user_id !== Number(user_id)) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    const updated = await commentsService.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /comments/:id — Stage E: only the comment's owner may delete it.
// The acting user's id is passed as a query param (?user_id=).
async function deleteComment(req, res, next) {
  try {
    const actingUserId = Number(req.query.user_id);
    if (!actingUserId) {
      return res.status(400).json({ message: "Query param 'user_id' is required" });
    }

    const existing = await commentsService.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (existing.user_id !== actingUserId) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    await commentsService.remove(req.params.id);
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
