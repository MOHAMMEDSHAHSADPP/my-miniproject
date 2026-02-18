// back/Models/RMarketOrder.js
const mongoose = require("mongoose");

const RMarketOrderSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RMarketProduct",
      required: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Captured at time of order
    productName: { type: String, required: true },
    productImage: { type: String },
    itemPrice: { type: Number, required: true }, // price per unit
    totalAmount: { type: Number, required: true },

    sellerName: { type: String },
    buyerName: { type: String },

    quantity: { type: Number, default: 1 },

    deliveryAddress: { type: String, required: true },
    phone: { type: String, required: true },

    paymentMode: {
      type: String,
      enum: ["COD"],
      default: "COD",
    },

    status: {
      type: String,
      enum: ["placed", "accepted", "rejected", "delivered", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RMarketOrder", RMarketOrderSchema);
