
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./Models/db");

// Models
const GovNotice = require("./Models/GovNotice");
const REvent = require("./Models/REvent");
const RPoll = require("./Models/RPoll");
const RWorkItem = require("./Models/RWorkItem");
const User = require("./Models/User");

// Mock Data
const MOCK_TOWN_SLUG = "town1"; // Adjust as needed, maybe fetch from a user
const MOCK_USER_ID = "000000000000000000000000"; // Dummy ID

async function run() {
    try {
        await connectDB();
        console.log("✅ DB Connected");

        // 1. Fetch a real user to get a valid townSlug
        const user = await User.findOne({ role: "resident" });
        const townSlug = user ? user.townSlug : MOCK_TOWN_SLUG;
        const userId = user ? user._id : MOCK_USER_ID;
        console.log(`ℹ️ Using Town: ${townSlug}, User: ${userId}`);

        // 2. Test GovNotices
        console.log("\n--- Testing GovNotices ---");
        try {
            const notices = await GovNotice.find({ townSlug, isActive: true }).sort({ deadline: 1 }).limit(5).lean();
            console.log(`✅ Fetched ${notices.length} notices`);
            const enriched = notices.map(item => ({
                ...item,
                acknowledged: (item.acknowledgedBy || []).some(id => String(id) === String(userId))
            }));
            console.log("✅ Enriched notices successfully");
        } catch (e) {
            console.error("❌ GovNotices Failed:", e);
        }

        // 3. Test Events
        console.log("\n--- Testing Events ---");
        try {
            const events = await REvent.find({ townSlug, isActive: true }).limit(5).lean();
            console.log(`✅ Fetched ${events.length} events`);
        } catch (e) {
            console.error("❌ Events Failed:", e);
        }

        // 4. Test Polls
        console.log("\n--- Testing Polls ---");
        try {
            const polls = await RPoll.find({ townSlug, isActive: true }).limit(5).lean();
            console.log(`✅ Fetched ${polls.length} polls`);
        } catch (e) {
            console.error("❌ Polls Failed:", e);
        }

        // 5. Test Works
        console.log("\n--- Testing Works ---");
        try {
            const works = await RWorkItem.find({ townSlug }).limit(5).lean();
            console.log(`✅ Fetched ${works.length} works`);
        } catch (e) {
            console.error("❌ Works Failed:", e);
        }

    } catch (err) {
        console.error("❌ Fatal Error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("\nDone.");
    }
}

run();
