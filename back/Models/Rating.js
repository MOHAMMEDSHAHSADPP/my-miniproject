const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    townSlug: String,
    ward: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    targetType: { type: String, enum: ["service", "shop", "panchayat"], default: "service" },
    targetId: { type: String, default: "" },

    stars: { type: Number, min: 1, max: 5 },
    comment: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rating", RatingSchema);
