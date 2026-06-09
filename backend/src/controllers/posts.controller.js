// =============================================================================
// controllers/posts.controller.js
// -----------------------------------------------------------------------------
// HTTP layer for the posts resource. Validates input, calls the posts DAL,
// returns proper status codes. No SQL here.
// =============================================================================

const postsService = require("../services/posts.service");

// GET /posts
async function getAllPosts(req, res, next) {
  try {
    const posts = await postsService.findAll();
    res.status(200).json(posts);
  } catch (err) {
    next(err);
  }
}

// GET /posts/:id
async function getPostById(req, res, next) {
  try {
    const post = await postsService.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
  } catch (err) {
    next(err);
  }
}

// GET /posts/:id/comments
async function getPostComments(req, res, next) {
  try {
    const post = await postsService.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comments = await postsService.findCommentsByPostId(req.params.id);
    res.status(200).json(comments);
  } catch (err) {
    next(err);
  }
}

// POST /posts
async function createPost(req, res, next) {
  try {
    const { user_id, title, body } = req.body;
    if (!user_id || !title || !body) {
      return res
        .status(400)
        .json({ message: "Fields 'user_id', 'title' and 'body' are required" });
    }
    const newPost = await postsService.create(req.body);
    res.status(201).json(newPost);
  } catch (err) {
    next(err);
  }
}

// PUT /posts/:id
async function updatePost(req, res, next) {
  try {
    const { user_id, title, body } = req.body;
    if (!user_id || !title || !body) {
      return res
        .status(400)
        .json({ message: "Fields 'user_id', 'title' and 'body' are required" });
    }
    const updated = await postsService.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /posts/:id
async function deletePost(req, res, next) {
  try {
    const deleted = await postsService.remove(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPosts,
  getPostById,
  getPostComments,
  createPost,
  updatePost,
  deletePost,
};
