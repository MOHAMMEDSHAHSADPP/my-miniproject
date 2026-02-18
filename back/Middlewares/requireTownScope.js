function norm(v = "") {
  return String(v).trim().toLowerCase();
}

module.exports = function requireTownScope(req, res, next) {
  try {
    // 1) Must be logged in
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 2) Normalize legacy role names
    // If old data still has town_admin, treat as admin
    let role = req.user.role;
    if (role === "town_admin") role = "admin";

    // 3) Super admin can access all towns
    if (role === "super_admin") {
      return next();
    }

    // 4) Only admin has town-scoped access
    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: only super_admin or admin can access this route",
        role,
      });
    }

    // 5) Compare route town slug with user town slug
    const routeTownSlug = norm(req.params.townSlug);
    const userTownSlug = norm(req.user.townSlug || req.admin?.townSlug); // Try admin object too

    // Diagnostic log (remove later)
    console.log(`TownScope Check: Route=${routeTownSlug}, User=${userTownSlug}, Role=${role}`);

    if (!routeTownSlug) {
      return res.status(400).json({ message: "townSlug param is required" });
    }

    if (!userTownSlug || userTownSlug === "undefined") {
      // If super admin passed check #3, they won't reach here.
      // So this is a regular admin/town_admin with no town.
      return res.status(403).json({
        message: "Forbidden: your account has no townSlug assigned",
      });
    }

    if (routeTownSlug !== userTownSlug) {
      return res.status(403).json({
        message: "Forbidden: out of town scope",
        yourTown: userTownSlug,
        requestedTown: routeTownSlug,
      });
    }

    // Optional: expose normalized role downstream
    req.user.role = role;

    return next();
  } catch (err) {
    console.error("requireTownScope ERROR:", err);
    return res.status(500).json({ message: "Town scope middleware error", error: err.message });
  }
};