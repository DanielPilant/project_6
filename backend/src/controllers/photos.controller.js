// =============================================================================
// controllers/photos.controller.js
// -----------------------------------------------------------------------------
// HTTP layer for photos (images by URL). Ownership is derived from the parent
// ALBUM: you may only add/edit/delete photos in an album you own (else 403).
// The acting user's id is sent in the body (POST/PUT) or as ?user_id= (DELETE).
// =============================================================================

const photosService = require("../services/photos.service");
const albumsService = require("../services/albums.service");

// Helper: load the album that owns a photo and check the acting user owns it.
// Returns { error: {status, message} } or { album }.
async function checkAlbumOwnership(albumId, actingUserId) {
  const album = await albumsService.findById(albumId);
  if (!album) {
    return { error: { status: 404, message: "Album not found" } };
  }
  if (album.user_id !== Number(actingUserId)) {
    return {
      error: {
        status: 403,
        message: "You can only modify photos in your own albums",
      },
    };
  }
  return { album };
}

// GET /photos
async function getAllPhotos(req, res, next) {
  try {
    const photos = await photosService.findAll();
    res.status(200).json(photos);
  } catch (err) {
    next(err);
  }
}

// GET /photos/:id
async function getPhotoById(req, res, next) {
  try {
    const photo = await photosService.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }
    res.status(200).json(photo);
  } catch (err) {
    next(err);
  }
}

// POST /photos — add an image (by URL) to an album you own
async function createPhoto(req, res, next) {
  try {
    const { album_id, url, user_id } = req.body;
    if (!album_id || !url || !user_id) {
      return res.status(400).json({
        message: "Fields 'album_id', 'url' and 'user_id' are required",
      });
    }

    const { error } = await checkAlbumOwnership(album_id, user_id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const newPhoto = await photosService.create(req.body);
    res.status(201).json(newPhoto);
  } catch (err) {
    next(err);
  }
}

// PUT /photos/:id — edit a photo in an album you own
async function updatePhoto(req, res, next) {
  try {
    const { url, user_id } = req.body;
    if (!url || !user_id) {
      return res
        .status(400)
        .json({ message: "Fields 'url' and 'user_id' are required" });
    }

    const photo = await photosService.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }
    const { error } = await checkAlbumOwnership(photo.album_id, user_id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const updated = await photosService.update(req.params.id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /photos/:id — remove a photo from an album you own (?user_id=)
async function deletePhoto(req, res, next) {
  try {
    const actingUserId = Number(req.query.user_id);
    if (!actingUserId) {
      return res
        .status(400)
        .json({ message: "Query param 'user_id' is required" });
    }

    const photo = await photosService.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }
    const { error } = await checkAlbumOwnership(photo.album_id, actingUserId);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    await photosService.remove(req.params.id);
    res.status(200).json({ message: "Photo deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPhotos,
  getPhotoById,
  createPhoto,
  updatePhoto,
  deletePhoto,
};
