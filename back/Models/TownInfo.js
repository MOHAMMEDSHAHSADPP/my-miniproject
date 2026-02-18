const mongoose = require("mongoose");

const TownInfoSchema = new mongoose.Schema(
    {
        townSlug: {
            type: String,
            required: true,
            index: true,
        },
        keyword: {
            type: String,
            required: true,
            trim: true, // e.g. "plumber", "electrician", "population"
            lowercase: true,
        },
        content: {
            type: String,
            required: true, // The bot's response
        },
        category: {
            type: String,
            default: "general", // general, contact, service
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TownInfo", TownInfoSchema);
