// back/Models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // ✅ OLD ADMIN FLAG (keep for your existing admin dashboard)
    isAdmin: { type: Boolean, default: false },

    // ✅ NEW ROLES (for visitor admin + resident admin)
    adminRole: {
      type: String,
      enum: ["none", "super_admin", "town_admin", "staff", "clerk", "moderator"],
      default: "none",
    },

    // ✅ OFFICIAL ROLE (critical for auth)
    role: { type: String, default: "resident" },

    // ✅ Only for town_admin (restrict admin to one town)
    adminTownSlug: { type: String, default: "" },

    // ✅ user state
    isBanned: { type: Boolean, default: false },

    // ✅ Resident context (after verification/signup)
    townName: { type: String, default: "" },
    townSlug: { type: String, default: "" },
    ward: { type: String, default: "" },

    residentRegistryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResidentRegistry",
      default: null,
    },

    // ✅ Volunteer Profile
    volunteer: {
      skills: [String],
      availability: String,
      description: String,
      age: Number,
      isActive: { type: Boolean, default: false },
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
