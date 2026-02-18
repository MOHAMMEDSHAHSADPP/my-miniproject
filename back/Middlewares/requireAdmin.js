// back/Middlewares/requireAdmin.js
exports.requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};