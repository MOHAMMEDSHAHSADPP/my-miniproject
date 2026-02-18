// back/Models/RMarketProduct.js
const mongoose = require("mongoose");

const RMarketProductSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true },
    description: { type: String, default: "" },

    category: {
      type: String,
      enum: ["vegetables", "fruits", "eggs", "food", "handmade", "other"],
      default: "other",
    },

    price: { type: Number, required: true },
    stockQty: { type: Number, default: 1 },

    images: [{ type: String }], // /uploads/resident/market/...

    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false }, // admin approval

    viewsCount: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RMarketProduct", RMarketProductSchema);
