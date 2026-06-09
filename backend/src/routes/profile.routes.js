// profile.routes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");

const upload =
require("../middleware/upload.middleware");

const {
    createWorkerProfile,
    createCustomerProfile
} = require("../controllers/profile.controller");



router.post(
    "/worker",
    auth,
    upload.single("profile_image"),
    createWorkerProfile
);


router.post(
    "/customer",
    auth,
    upload.single("profile_image"),
    createCustomerProfile
);
const profileCtrl = require("../controllers/profile.controller");
const  protect  = require("../middleware/auth.middleware");

router.get("/profile",  protect, profileCtrl.getProfile);
router.put("/profile",  protect, profileCtrl.updateProfile);
router.get("/profile/customer", protect , profileCtrl.getCustomerProfile);


module.exports = router;