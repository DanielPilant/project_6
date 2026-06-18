// =============================================================================
// controllers/albums.controller.js
// -----------------------------------------------------------------------------
// HTTP layer for albums. Validates input, calls the albums DAL, returns proper
// status codes. PUT/DELETE are owner-only (like posts): acting user must own
// the album, else 403.
// =============================================================================

const albumsService = require("../services/albums.service");

// GET /albums
async function getAllAlbums(req, res, next) {
  try {
    const albums = await albumsService.findAll();
    res.status(200).json(albums);
  } catch (err) {
    next(err);
  }
}

// GET /albums/:id
async function getAlbumById(req, res, next) {
  try {
    const album = await albumsService.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    res.status(200).json(album);
  } catch (err) {
    next(err);
  }
}

// GET /albums/:id/photos
async function getAlbumPhotos(req, res, next) {
  try {
    const album = await albumsService.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    const photos = await albumsService.findPhotosByAlbumId(req.params.id);
    res.status(200).json(photos);
  } catch (err) {
    next(err);
  }
}

// POST /albums
async function createAlbum(req, res, next) {
  try {
    const { user_id, title } = req.body;
    if (!user_id || !title) {
      return res
        .status(400)
        .json({ message: "Fields 'user_id' and 'title' are required" });
    }
    const newAlbum = await albumsService.create(req.body);
    res.status(201).json(newAlbum);
  } catch (err) {
    next(err);
  }
}

// PUT /albums/:id — owner-only
async function updateAlbum(req, res, next) {
  try {
    const { user_id, title } = req.body;
    if (!user_id || !title) {
      return res
        .status(400)
        .json({ message: "Fields 'user_id' and 'title' are required" });
    }

    const existing = await albumsService.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Album not found" });
    }
    if (existing.user_id !== Number(user_id)) {
      return res
        .status(403)
        .json({ message: "You can only edit your own albums" });
    }

    const updated = await albumsService.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /albums/:id — owner-only (acting user via ?user_id=)
async function deleteAlbum(req, res, next) {
  try {
    const actingUserId = Number(req.query.user_id);
    if (!actingUserId) {
      return res
        .status(400)
        .json({ message: "Query param 'user_id' is required" });
    }

    const existing = await albumsService.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Album not found" });
    }
    if (existing.user_id !== actingUserId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own albums" });
    }

    await albumsService.remove(req.params.id);
    res.status(200).json({ message: "Album deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllAlbums,
  getAlbumById,
  getAlbumPhotos,
  createAlbum,
  updateAlbum,
  deleteAlbum,
};
