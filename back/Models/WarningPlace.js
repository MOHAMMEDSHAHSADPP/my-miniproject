const mongoose = require("mongoose");

const WarningPlaceSchema = new mongoose.Schema(
    {
        townSlug: {
            type: String,
            required: true,
            index: true,
        },
        townName: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        image: {
            type: String, // Path to uploaded image
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        mapUrl: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("WarningPlace", WarningPlaceSchema);
