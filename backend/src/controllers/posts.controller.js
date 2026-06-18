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

// PUT /posts/:id — Stage E: only the post's owner may update it.
async function updatePost(req, res, next) {
  try {
    const { user_id, title, body } = req.body;
    if (!user_id || !title || !body) {
      return res
        .status(400)
        .json({ message: "Fields 'user_id', 'title' and 'body' are required" });
    }

    const existing = await postsService.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Ownership check: acting user (user_id) must be the post's owner.
    if (existing.user_id !== Number(user_id)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    const updated = await postsService.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /posts/:id — Stage E: only the post's owner may delete it.
// The acting user's id is passed as a query param (?user_id=).
async function deletePost(req, res, next) {
  try {
    const actingUserId = Number(req.query.user_id);
    if (!actingUserId) {
      return res
        .status(400)
        .json({ message: "Query param 'user_id' is required" });
    }

    const existing = await postsService.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Post not found" });
    }
    if (existing.user_id !== actingUserId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    await postsService.remove(req.params.id);
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
