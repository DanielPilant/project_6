// =============================================================================
// routes/admin.routes.js
// -----------------------------------------------------------------------------
// All admin endpoints. requireAdmin guards every route (verifies admin_id).
// =============================================================================

const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/requireAdmin");
const adminController = require("../controllers/admin.controller");

// Every admin route requires a verified admin.
router.use(requireAdmin);

// Full database snapshot
router.get("/data", adminController.getData);

// User management (declare BEFORE the generic /:resource/:id routes so these
// specific paths match first)
router.put("/users/:id/role", adminController.setUserRole);
router.put("/users/:id/block", adminController.setUserBlocked);

// Generic content edit/delete (posts, comments, todos, albums, photos)
router.put("/:resource/:id", adminController.updateResource);
router.delete("/:resource/:id", adminController.deleteResource);

module.exports = router;
