// back/Models/RPoll.js
const mongoose = require("mongoose");

const RPollSchema = new mongoose.Schema(
  {
    townSlug: {
      type: String,
      required: true,
      index: true,
    },

    ward: {
      type: String,
      default: "", // empty = whole town poll
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],

    votedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RPoll", RPollSchema);
