// =============================================================================
// routes/photos.routes.js
// -----------------------------------------------------------------------------
// Endpoint wiring for the photos resource.
// =============================================================================

const express = require("express");
const router = express.Router();
const photosController = require("../controllers/photos.controller");

// Collection
router.get("/", photosController.getAllPhotos);
router.post("/", photosController.createPhoto);

// Single item
router.get("/:id", photosController.getPhotoById);
router.put("/:id", photosController.updatePhoto);
router.delete("/:id", photosController.deletePhoto);

module.exports = router;
