// back/Routes/AuditRoutes.js
const router = require("express").Router();

const authMiddleware = require("../Middlewares/authMiddleware");
const requireRole = require("../Middlewares/requireRole");

// ✅ IMPORTANT: import controller correctly
const Audit = require("../Controllers/AuditController");

console.log("✅ LOADED: Routes/AuditRoutes.js");

// ✅ Debug: will show if your handlers are functions
console.log("typeof Audit.list:", typeof Audit.list);
console.log("typeof Audit.create:", typeof Audit.create);

router.use(authMiddleware);

// Only roles that can view logs (edit if you want)
router.get(
  "/audit",
  requireRole(["super_admin", "town_admin", "staff", "clerk", "moderator"]),
  Audit.list
);

router.post(
  "/audit",
  requireRole(["super_admin", "town_admin", "staff", "clerk", "moderator"]),
  Audit.create
);

module.exports = router;