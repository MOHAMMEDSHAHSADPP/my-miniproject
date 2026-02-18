// Test ALL admin endpoints
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const http = require("http");

const endpoints = [
    "/admin/notices",
    "/admin/events",
    "/admin/polls",
    "/admin/works",
    "/admin/alerts",
    "/admin/complaints",
    "/admin/suggestions",
    "/admin/tickets",
    "/admin/services/requests",
    "/admin/registry",
    "/resident/gov-notices",
    "/resident/events",
    "/resident/polls",
    "/resident/works",
];

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const User = require("./Models/User");
    let admin = await User.findOne({ role: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ adminRole: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ isAdmin: true }).lean();
    if (!admin) { console.log("No admin"); process.exit(1); }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);
    let done = 0;

    for (const ep of endpoints) {
        const req = http.get("http://localhost:8081" + ep, {
            headers: { Authorization: "Bearer " + token }
        }, (res) => {
            let body = "";
            res.on("data", (c) => body += c);
            res.on("end", () => {
                const icon = res.statusCode === 200 ? "✅" : "❌";
                console.log(`${icon} ${res.statusCode} ${ep} → ${body.substring(0, 80)}`);
                done++;
                if (done === endpoints.length) process.exit(0);
            });
        });
        req.on("error", (e) => {
            console.log(`❌ ERR ${ep} → ${e.message}`);
            done++;
            if (done === endpoints.length) process.exit(0);
        });
    }
});
