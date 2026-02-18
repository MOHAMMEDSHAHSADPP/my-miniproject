const mongoose = require("mongoose");

const RSuggestionSchema = new mongoose.Schema({
    townSlug: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subject: { type: String, required: true },
    description: { type: String },
    status: { type: String, default: "open", enum: ["open", "reviewed", "implemented"] },
}, { timestamps: true });

module.exports = mongoose.model("RSuggestion", RSuggestionSchema);
