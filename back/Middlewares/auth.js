// back/Middlewares/auth.js
const jwt = require("jsonwebtoken");
const User = require("../Models/User"); // adjust path if your User model is elsewhere

// ✅ Read JWT, attach req.user
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // decoded.id or decoded._id based on your token
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "User is banned" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid" });
  }
};

// ✅ Allow old admin OR resident-admin roles
exports.allowAdminOrResidentRoles = (...roles) => {
  return (req, res, next) => {
    // Must have req.user (so protect must run before this)
    const u = req.user;

    // OLD admin style
    if (u?.isAdmin === true) return next();

    // NEW resident roles style
    if (roles.includes(u?.role)) return next();

    return res.status(403).json({ message: "Forbidden" });
  };
};

// ✅ If you want a strict resident-admin check only
exports.allowResidentRolesOnly = (...roles) => {
  return (req, res, next) => {
    const u = req.user;
    if (roles.includes(u?.role)) return next();
    return res.status(403).json({ message: "Forbidden" });
  };
};