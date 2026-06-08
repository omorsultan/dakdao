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

module.exports = router;