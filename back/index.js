// back/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./Models/db");

const AuthRoutes = require("./Routes/AuthRoutes");
const AdminRoutes = require("./Routes/AdminRoutes");

const VisitorPublicRoutes = require("./Routes/VisitorPublicRoutes");
const ResidentPublicRoutes = require("./Routes/ResidentPublicRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.use("/uploads/visitor", express.static("uploads/visitor"));
app.use("/uploads/resident", express.static("uploads/resident"));

app.get("/ping", (req, res) => res.send("pong"));

app.use("/auth", AuthRoutes);

// ✅ UNIFIED ADMIN ROUTES
app.use("/admin", AdminRoutes);

// visitor public
app.use("/visitor", VisitorPublicRoutes);

// resident public
app.use("/resident", ResidentPublicRoutes);

connectDB();

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`✅ Backend running on ${PORT}`);
    console.log(`🚀 NEW ADMIN AUTH SYSTEM ACTIVE (v2.0)`);
});