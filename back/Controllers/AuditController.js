// back/Controllers/AuditController.js
const AuditLog = require("../Models/AuditLog");

// ✅ list audit logs
exports.list = async (req, res) => {
  try {
    const { q = "", limit = 50 } = req.query;

    const filter = q
      ? {
          $or: [
            { action: new RegExp(q, "i") },
            { entity: new RegExp(q, "i") },
            { message: new RegExp(q, "i") },
            { "meta.townSlug": new RegExp(q, "i") },
            { "meta.userEmail": new RegExp(q, "i") },
          ],
        }
      : {};

    const logs = await AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    return res.json(logs);
  } catch (e) {
    return res.status(500).json({ message: "Failed to load audit logs" });
  }
};

// ✅ create audit log
exports.create = async (req, res) => {
  try {
    const user = req.user;

    const body = req.body || {};
    const log = await AuditLog.create({
      action: body.action || "unknown",
      entity: body.entity || "unknown",
      entityId: body.entityId || null,
      message: body.message || "",
      meta: {
        ...body.meta,
        userId: user?._id,
        userEmail: user?.email,
        role: user?.role || (user?.isAdmin ? "super_admin" : ""),
        townSlug: user?.townSlug || user?.townName || user?.town || "",
      },
    });

    return res.json({ ok: true, log });
  } catch (e) {
    return res.status(500).json({ message: "Failed to create audit log" });
  }
};