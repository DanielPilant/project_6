// =============================================================================
// routes/posts.routes.js
// -----------------------------------------------------------------------------
// Endpoint wiring for the posts resource, including the nested
// /posts/:id/comments read.
// =============================================================================

const express = require("express");
const router = express.Router();
const postsController = require("../controllers/posts.controller");

// Collection
router.get("/", postsController.getAllPosts);
router.post("/", postsController.createPost);

// Nested resource
router.get("/:id/comments", postsController.getPostComments);

// Single item
router.get("/:id", postsController.getPostById);
router.put("/:id", postsController.updatePost);
router.delete("/:id", postsController.deletePost);

module.exports = router;
