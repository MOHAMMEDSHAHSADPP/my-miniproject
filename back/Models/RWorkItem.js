// back/Models/RWorkItem.js
const mongoose = require("mongoose");

const RWorkItemSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },
    ward: { type: String, default: "" },

    category: {
      type: String,
      enum: ["road", "drainage", "streetlight", "water", "other"],
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    status: {
      type: String,
      enum: ["planned", "ongoing", "completed"],
      default: "planned",
    },

    startDate: { type: Date },
    expectedEndDate: { type: Date },
    completedDate: { type: Date },

    // New Fields
    image: { type: String, default: "" },
    mapLink: { type: String, default: "" },
    budget: { type: Number, default: 0 },
    deadline: { type: Date },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RWorkItem", RWorkItemSchema);
