// back/Models/Place.js
const mongoose = require("mongoose");

const PlaceSchema = new mongoose.Schema(
  {
    // town mapping
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    // category of place
    category: {
      type: String,
      required: true,
      enum: [
        "hotel",
        "lodge",
        "hospital",
        "restaurant",
        "shop",
        "toilet",
        "tourist_spot",
        "govt",
        "service",
        "danger",
        "culture",
        "bank",
      ],
    },

    // basic info
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    // map info
    mapUrl: {
      type: String,
      trim: true,
    },

    lat: {
      type: Number,
    },

    lng: {
      type: Number,
    },

    // category-specific extra details (JSON)
    details: {
      type: Object,
      default: {},
    },

    // images
    images: {
      type: [String], // /uploads/visitor/xxx.jpg
      default: [],
    },

    // stats
    viewsCount: {
      type: Number,
      default: 0,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    // moderation
    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Place", PlaceSchema);