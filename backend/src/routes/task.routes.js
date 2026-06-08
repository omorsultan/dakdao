// routes/task.routes.js
const express    = require("express");
const router     = express.Router();
const taskCtrl   = require("../controllers/task.controller");
const protect = require("../middleware/auth.middleware");
// console.log(taskCtrl);
// Categories
router.get("/categories",          protect, taskCtrl.getCategories);

// Tasks
router.post("/tasks",              protect, taskCtrl.createTask);
router.get("/tasks",               protect, taskCtrl.getOpenTasks);      // ?status=open
router.get("/tasks/my",            protect, taskCtrl.getMyTasks);        // customer's own tasks
router.get("/tasks/assigned",      protect, taskCtrl.getAssignedTasks);  // worker's accepted tasks
router.get("/tasks/:id",           protect, taskCtrl.getTaskById);
router.patch("/tasks/:id/status",  protect, taskCtrl.updateTaskStatus);
router.delete("/tasks/:id",        protect, taskCtrl.deleteTask);

module.exports = router;