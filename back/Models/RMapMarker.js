// back/Models/RMapMarker.js
const mongoose = require("mongoose");

const RMapMarkerSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    ward: { type: String, default: "" },

    type: {
      type: String,
      enum: [
        "flood_zone",
        "accident_zone",
        "unsafe_road",
        "tree_fallen",
        "fire_risk",
        "other",
      ],
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RMapMarker", RMapMarkerSchema);
