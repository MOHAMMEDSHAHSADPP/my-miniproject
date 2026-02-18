// back/Models/db.js
const mongoose = require("mongoose");

module.exports = async function connectDB() {
  try {
    const uri = process.env.MONGO_URL;
    if (!uri) {
      console.error("❌ MONGO_URI missing in .env");
      process.exit(1);
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};
