// Quick test script to hit /admin/notices with a real token
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const http = require("http");

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const User = require("./Models/User");

    // Find any admin user
    let admin = await User.findOne({ role: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ adminRole: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ isAdmin: true }).lean();

    if (!admin) {
        console.log("No admin user found");
        process.exit(1);
    }

    console.log("Admin:", admin.email);
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    const req = http.get("http://localhost:8081/admin/notices", {
        headers: { Authorization: "Bearer " + token }
    }, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
            console.log("Status:", res.statusCode);
            console.log("Body:", body.substring(0, 500));
            process.exit(0);
        });
    });

    req.on("error", (e) => {
        console.error("Request error:", e.message);
        process.exit(1);
    });
});
