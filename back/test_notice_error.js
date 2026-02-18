// Test script to reproduce the exact 500 error
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: ".env" });
const mongoose = require("mongoose");
const http = require("http");

mongoose.connect(process.env.MONGO_URL).then(async () => {
    const User = require("./Models/User");

    // Find admin user
    let admin = await User.findOne({ role: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ adminRole: "super_admin" }).lean();
    if (!admin) admin = await User.findOne({ isAdmin: true }).lean();

    if (!admin) {
        console.log("No admin user found");
        process.exit(1);
    }

    console.log("Admin user:", admin.email);
    console.log("Admin townSlug:", admin.townSlug);
    console.log("Admin adminTownSlug:", admin.adminTownSlug);

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    // Test 1: WITH townSlug (should work)
    console.log("\n=== Test 1: WITH townSlug ===");
    const postData1 = JSON.stringify({
        title: "Test Notice WITH townSlug",
        description: "Test",
        priority: "normal",
        townSlug: "test-town"
    });

    const req1 = http.request({
        hostname: "localhost",
        port: 8081,
        path: "/admin/notices",
        method: "POST",
        headers: {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(postData1)
        }
    }, (res) => {
        let body = "";
        res.on("data", (c) => body += c);
        res.on("end", () => {
            console.log("Status:", res.statusCode);
            console.log("Body:", body.substring(0, 200));

            // Test 2: WITHOUT townSlug (should fail with 400 or 500)
            console.log("\n=== Test 2: WITHOUT townSlug ===");
            const postData2 = JSON.stringify({
                title: "Test Notice WITHOUT townSlug",
                description: "Test",
                priority: "normal"
            });

            const req2 = http.request({
                hostname: "localhost",
                port: 8081,
                path: "/admin/notices",
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(postData2)
                }
            }, (res2) => {
                let body2 = "";
                res2.on("data", (c) => body2 += c);
                res2.on("end", () => {
                    console.log("Status:", res2.statusCode);
                    console.log("Body:", body2);
                    process.exit(0);
                });
            });

            req2.on("error", (e) => {
                console.error("Request 2 error:", e.message);
                process.exit(1);
            });

            req2.write(postData2);
            req2.end();
        });
    });

    req1.on("error", (e) => {
        console.error("Request 1 error:", e.message);
        process.exit(1);
    });

    req1.write(postData1);
    req1.end();
});
