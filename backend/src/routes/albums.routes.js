// =============================================================================
// routes/albums.routes.js
// -----------------------------------------------------------------------------
// Endpoint wiring for the albums resource, incl. nested /albums/:id/photos.
// =============================================================================

const express = require("express");
const router = express.Router();
const albumsController = require("../controllers/albums.controller");

// Collection
router.get("/", albumsController.getAllAlbums);
router.post("/", albumsController.createAlbum);

// Nested resource
router.get("/:id/photos", albumsController.getAlbumPhotos);

// Single item
router.get("/:id", albumsController.getAlbumById);
router.put("/:id", albumsController.updateAlbum);
router.delete("/:id", albumsController.deleteAlbum);

module.exports = router;
