// back/Middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../Models/User");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "Invalid token user" });

    if (user.isBanned) return res.status(403).json({ message: "Account banned" });

    // ✅ SYNC LEGACY ROLES
    // If schema default 'resident' is active but adminRole says 'super_admin'/'town_admin', trust adminRole
    if ((!user.role || user.role === "resident" || user.role === "none") &&
      ["super_admin", "town_admin", "admin"].includes(user.adminRole)) {
      user.role = user.adminRole;
    }

    console.log(`🔑 AUTH: ${user.email} | Role: ${user.role} | AdminRole: ${user.adminRole}`);

    req.user = user;
    next();
  } catch (e) {
    console.error("authMiddleware error:", e.message);
    return res.status(401).json({ message: "Unauthorized" });
  }
};