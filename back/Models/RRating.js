// back/Models/RRating.js
const mongoose = require("mongoose");

const RRatingSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    ward: { type: String, default: "" },

    targetType: {
      type: String,
      enum: ["service", "shop", "panchayat"],
      required: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comment: { type: String, default: "" },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RRating", RRatingSchema);
