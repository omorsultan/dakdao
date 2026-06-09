// routes/task.routes.js
const express    = require("express");
const router     = express.Router();
const taskCtrl   = require("../controllers/task.controller");
const protect = require("../middleware/auth.middleware");
// console.log(taskCtrl);

router.get("/categories", protect, taskCtrl.getCategories);
 
router.post("/tasks", protect, taskCtrl.createTask);
router.get("/tasks/my", protect, taskCtrl.getMyTasks);
router.get("/tasks/assigned", protect, taskCtrl.getAssignedTasks);
router.get("/tasks", protect, taskCtrl.getOpenTasks);
router.get("/tasks/:id", protect, taskCtrl.getTaskById);
router.patch("/tasks/:id/status", protect, taskCtrl.updateTaskStatus);
router.delete("/tasks/:id", protect, taskCtrl.deleteTask);
router.get("/public/tasks", taskCtrl.getOpenTasks);
router.get("/public/tasks/search", taskCtrl.searchTasks);

module.exports = router;