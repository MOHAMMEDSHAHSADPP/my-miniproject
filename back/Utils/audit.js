// back/Utils/audit.js
const AuditLog = require("../Models/AuditLog");

/**
 * Log an audit event. Accepts EITHER:
 *   audit({ action, actor, townSlug, ... })        ← object form (TownController, VisitorAdminController)
 *   audit(req, actionString, metaObj)               ← legacy positional form (ResidentPublicController)
 */
async function audit(first, second, third) {
  try {
    let action, actor, townSlug, entityType, entityId, before, after, meta;

    if (typeof first === "object" && !first.user && typeof first.action === "string") {
      // Object form: audit({ action, actor, ... })
      ({ action, actor, townSlug = "", entityType = "", entityId = "", before = null, after = null, meta = {} } = first);
    } else if (first && first.user) {
      // Legacy positional: audit(req, "action_string", { ...meta })
      actor = first.user;
      action = String(second || "unknown");
      townSlug = actor.townSlug || "";
      meta = third || {};
    } else {
      return;
    }

    if (!action || !actor?._id) return;

    await AuditLog.create({
      action,
      actorId: actor._id,
      actorName: actor.name || "",
      actorEmail: actor.email || "",
      actorRole: actor.adminRole || (actor.isAdmin ? "admin" : "resident"),
      townSlug: townSlug || actor.townSlug || "",
      entityType: entityType || "",
      entityId: entityId || "",
      before: before || null,
      after: after || null,
      meta: meta || {},
    });
  } catch (e) {
    console.error("⚠️ audit log failed:", e.message);
  }
}

// Support BOTH import styles:
//   const audit = require("../utils/audit")       → audit({...})
//   const { audit } = require("../utils/audit")   → audit({...})
module.exports = audit;
module.exports.audit = audit;
