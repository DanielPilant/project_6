// =============================================================================
// routes/comments.routes.js
// -----------------------------------------------------------------------------
// Endpoint wiring for the comments resource.
// =============================================================================

const express = require("express");
const router = express.Router();
const commentsController = require("../controllers/comments.controller");

// Collection
router.get("/", commentsController.getAllComments);
router.post("/", commentsController.createComment);

// Single item
router.get("/:id", commentsController.getCommentById);
router.put("/:id", commentsController.updateComment);
router.delete("/:id", commentsController.deleteComment);

module.exports = router;
