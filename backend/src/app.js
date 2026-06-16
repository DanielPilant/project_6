// =============================================================================
// app.js — Express application assembly
// -----------------------------------------------------------------------------
// Builds and configures the Express app: global middleware, mounts each
// resource router under its base path, then the 404 + error handlers LAST.
// Kept separate from server.js so the app can be imported by tests without
// actually starting a listening socket.
// =============================================================================

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const postsRoutes = require("./routes/posts.routes");
const todosRoutes = require("./routes/todos.routes");
const commentsRoutes = require("./routes/comments.routes");
const albumsRoutes = require("./routes/albums.routes");
const photosRoutes = require("./routes/photos.routes");
const adminRoutes = require("./routes/admin.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// --- Global middleware ---
app.use(cors()); // allow the front-end (different origin) to call this API
app.use(express.json()); // parse JSON request bodies into req.body

// --- Health check ---
app.get("/", (req, res) => {
  res.json({
    name: "jsonplaceholder-backend",
    status: "ok",
    resources: [
      "/users",
      "/posts",
      "/todos",
      "/comments",
      "/albums",
      "/photos",
    ],
  });
});

// --- Auth routes (POST /login, POST /register) ---
app.use("/", authRoutes);

// --- Resource routers ---
app.use("/users", usersRoutes);
app.use("/posts", postsRoutes);
app.use("/todos", todosRoutes);
app.use("/comments", commentsRoutes);
app.use("/albums", albumsRoutes);
app.use("/photos", photosRoutes);
app.use("/admin", adminRoutes);

// --- 404 + centralized error handling (must come last) ---
app.use(notFound);
app.use(errorHandler);

module.exports = app;
