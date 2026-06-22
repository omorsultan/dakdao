const express    = require("express");
const router     = express.Router();
const taskCtrl   = require("../controllers/task.controller");
const offerCtrl  = require("../controllers/offer.controller"); // Ensure this is imported
const protect    = require("../middleware/auth.middleware");

router.get("/categories", protect, taskCtrl.getCategories);
 
router.post("/tasks", protect, taskCtrl.createTask);
router.get("/tasks/my", protect, taskCtrl.getMyTasks);
router.get("/tasks/assigned", protect, taskCtrl.getAssignedTasks);
router.get("/tasks", protect, taskCtrl.getOpenTasks);
router.get("/tasks/:id", protect, taskCtrl.getTaskById);
router.patch("/tasks/:id/status", protect, taskCtrl.updateTaskStatus);
router.delete("/tasks/:id", protect, taskCtrl.deleteTask);

// --- Offers sub-resource endpoint used by detail view ---
router.get("/tasks/:task_id/offers", protect, offerCtrl.getTaskOffers);
router.patch("/offers/:offer_id/status", protect, offerCtrl.acceptOffer); 
router.post("/offers/:offer_id/counter", protect, offerCtrl.sendCounterOffer);

module.exports = router;