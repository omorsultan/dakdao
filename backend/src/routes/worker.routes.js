const express = require("express");
const router = express.Router();
const workerCtrl = require("../controllers/worker.controller");
const protect = require("../middleware/auth.middleware");

// GET /api/workers - Fetch all registered workers
// Note: If you want this fully public for anonymous customers, remove the 'protect' middleware layer
router.get("/workers", protect, workerCtrl.getAllWorkers);

module.exports = router;