const express = require("express");
const router = express.Router();
const messageCtrl = require("../controllers/message.controller");
const protect = require("../middleware/auth.middleware");

// Core messaging endpoints
router.post("/messages", protect, messageCtrl.sendMessage);
router.get("/messages/task/:task_id", protect, messageCtrl.getTaskMessages);

module.exports = router;