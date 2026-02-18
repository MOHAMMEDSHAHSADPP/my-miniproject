// back/Models/RChatRoom.js
const mongoose = require("mongoose");

const RChatRoomSchema = new mongoose.Schema(
  {
    townSlug: { type: String, required: true, index: true },

    // town | ward | custom | dm
    scope: {
      type: String,
      enum: ["town", "ward", "custom", "dm"],
      required: true,
      index: true,
    },

    // only for ward scope
    ward: { type: String, default: "", index: true },

    // room title (optional) — used by custom/admin rooms
    name: { type: String, default: "" },

    // for custom room membership / dm
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // used for DM rooms only: stable key like "minUserId:maxUserId"
    // NOTE: No default — left undefined for non-DM rooms so sparse index skips them
    dmKey: { type: String, index: true },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// General scope lookup
RChatRoomSchema.index({ townSlug: 1, scope: 1 }, { unique: false });

// Ward room lookup
RChatRoomSchema.index({ townSlug: 1, scope: 1, ward: 1 }, { unique: false });

// DM unique per town + dmKey (sparse so non-DM rooms without dmKey are skipped)
RChatRoomSchema.index({ townSlug: 1, scope: 1, dmKey: 1 }, { unique: true, sparse: true });

// Custom rooms unique by name within a town
RChatRoomSchema.index({ townSlug: 1, scope: 1, name: 1 }, { unique: false });

module.exports = mongoose.model("RChatRoom", RChatRoomSchema);
