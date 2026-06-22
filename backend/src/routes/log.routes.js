const express = require("express");
const router = express.Router();
const logCtrl = require("../controllers/log.controller");
const protect = require("../middleware/auth.middleware");

// User routes
router.get("/logs/my", protect, logCtrl.getMyLogs);

// Admin dashboard route
router.get("/admin/logs", protect, logCtrl.getAllLogs);

module.exports = router;