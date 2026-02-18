const mongoose = require("mongoose");
require("dotenv").config();
const ResidentRegistry = require("./Models/ResidentRegistry");
const ResidentAdminController = require("./Controllers/ResidentAdminController");

// Mock req, res
const mockReq = {
    body: {
        fullName: "Test User",
        houseNo: "123",
        ward: "1",
        dob: "1990-01-01",
        voterId: "VOT12345",
        townName: "Test Town",
        townSlug: "test-town" // pre-filled
    },
    admin: { isSuper: true }
};

const mockRes = {
    status: function (code) {
        console.log("Status:", code);
        return this;
    },
    json: function (data) {
        console.log("JSON:", data);
    }
};

async function test() {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // Cleanup first
        await ResidentRegistry.deleteMany({ voterId: "VOT12345" });

        console.log("Testing registryCreate...");
        await ResidentAdminController.registryCreate(mockReq, mockRes);

    } catch (e) {
        console.error("TEST SCRIPT ERROR:", e);
    } finally {
        await mongoose.disconnect();
    }
}

test();
