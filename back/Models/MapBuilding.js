const mongoose = require("mongoose");

const mapBuildingSchema = new mongoose.Schema(
    {
        townSlug: { type: String, required: true, index: true },
        osmId: { type: String, required: true, index: true }, // OpenStreetMap building ID
        customName: { type: String, default: "" }, // Admin-set hashtag name
        type: { type: String, default: "other" }, // shop, restaurant, hospital, gov, etc.
        image: { type: String, default: "" }, // Uploaded image path
        description: { type: String, default: "" },
        active: { type: Boolean, default: true },
        centroid: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true }
        },
        // Optional: store OSM metadata for reference
        osmData: {
            name: String, // Original OSM name
            buildingType: String, // OSM building tag value
            levels: Number, // building:levels
            height: Number // height in meters
        }
    },
    { timestamps: true }
);

// Compound index for efficient queries
mapBuildingSchema.index({ townSlug: 1, osmId: 1 }, { unique: true });

module.exports = mongoose.model("MapBuilding", mapBuildingSchema);
