const mongoose = require("mongoose");

const TrendingSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    townName: { type: String, default: "" },

    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    image: { type: String, default: "" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Trending", TrendingSchema);
