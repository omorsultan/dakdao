// src/app.js

const express = require("express");
const cors = require("cors");
const path = require("path");


const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const taskRoutes = require("./routes/task.routes");
const offerRoutes = require("./routes/offer.routes");

const app = express();

app.use(cors());
app.use(express.json());


app.use("/uploads",express.static(path.join(__dirname, "../uploads")));
app.use("/api/profile",profileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", taskRoutes);
app.use("/api", profileRoutes);
app.use("/api", offerRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Dakdao API Running"
    });
});


module.exports = app;