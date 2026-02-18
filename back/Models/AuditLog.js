// back/Models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: null },
    message: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);