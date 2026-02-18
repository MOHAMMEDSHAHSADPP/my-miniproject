// Test with EXACT frontend payload format
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const http = require("http");

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const User = require("./Models/User");

    let admin = await User.findOne({ role: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ adminRole: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ isAdmin: true }).lean();

    if (!admin) {
        console.log("No admin");
        process.exit(1);
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    // Test with empty deadline (frontend sends empty string)
    const postData = JSON.stringify({
        title: "Test Notice",
        description: "Test description",
        priority: "normal",
        deadline: "",  // Empty string, not null
        townSlug: "test-town"
    });

    const req = http.request({
        hostname: "localhost",
        port: 8081,
        path: "/admin/notices",
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData)
        }
    }, (res) => {
        let body = "";
        res.on("data", (c) => body += c);
        res.on("end", () => {
            console.log("Status:", res.statusCode);
            console.log("Body:", body);
            process.exit(0);
        });
    });

    req.on("error", (e) => {
        console.error("Request error:", e.message);
        process.exit(1);
    });

    req.write(postData);
    req.end();
});
