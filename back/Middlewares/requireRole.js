module.exports = function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // normalize old role
      let userRole = req.user.role;
      if (userRole === "town_admin") userRole = "admin";

      if (!allowedRoles.includes(userRole)) {
        console.log(`❌ Role Mismatch! User: ${req.user.email} (${userRole}), Allowed: ${allowedRoles}, Path: ${req.originalUrl}, Method: ${req.method}`);
        return res.status(403).json({
          message: "Forbidden: insufficient role",
          role: userRole,
          allowed: allowedRoles,
        });
      }

      req.user.role = userRole;
      next();
    } catch (err) {
      return res.status(500).json({ message: "Role middleware error" });
    }
  };
};