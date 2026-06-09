// routes/offer.routes.js
const express = require("express");
const router = express.Router();
const offerCtrl = require("../controllers/offer.controller");
const  protect  = require("../middleware/auth.middleware");

router.post("/offers", protect, offerCtrl.sendOffer);
router.get("/offers/my", protect, offerCtrl.getMyOffers);
router.get("/tasks/:task_id/offers", protect, offerCtrl.getTaskOffers);
router.patch("/offers/:offer_id/accept", protect, offerCtrl.acceptOffer);
router.patch("/offers/:offer_id/reject", protect, offerCtrl.rejectOffer);
router.delete("/offers/:offer_id", protect, offerCtrl.withdrawOffer);
// SEND COUNTER OFFER (Can be used by either Customer or Worker)
router.post("/offers/:offer_id/counter", protect, offerCtrl.sendCounterOffer);

// GENERIC ACCEPT (Accepts whichever counter/initial offer is currently active)
router.patch("/offers/:offer_id/accept-negotiation", protect, offerCtrl.acceptNegotiation);
router.get("/offers/confirmed-earnings", protect, offerCtrl.getConfirmedEarnings);

module.exports = router;