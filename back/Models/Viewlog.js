const mongoose = require("mongoose");

const ViewLogSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true },
    placeId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ViewLog", ViewLogSchema);
