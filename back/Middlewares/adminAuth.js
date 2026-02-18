const jwt = require("jsonwebtoken");
const User = require("../Models/User");

module.exports = async function adminAuth(req, res, next) {
    try {
        // 1. Get Token
        const auth = req.headers.authorization || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token) return res.status(401).json({ message: "No token provided" });

        // 2. Verify Token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(401).json({ message: "Invalid user token" });
        if (user.isBanned) return res.status(403).json({ message: "Account banned" });

        // 3. Normalize Admin Role
        let role = "none";
        let townSlug = "";

        // Priority 1: Official 'role' field
        if (["super_admin", "town_admin", "admin"].includes(user.role)) {
            role = user.role;
        }
        // Priority 2: 'adminRole' field
        else if (["super_admin", "town_admin", "admin"].includes(user.adminRole)) {
            role = user.adminRole;
        }
        // Priority 3: 'isAdmin' flag
        else if (user.isAdmin === true) {
            role = "super_admin";
        }

        // 4. Check capabilities
        if (role === "none" || role === "resident") {
            console.log(`⛔ AdminAuth Blocked: ${user.email}`);
            return res.status(403).json({ message: "Access denied: Admins only" });
        }

        // 5. Override user.role for downstream middleware compatibility
        user.role = role;

        // 6. Town Scope — populate for ALL admin roles (super_admin included)
        townSlug = user.adminTownSlug || user.townSlug || "";

        // 7. Attach
        req.user = user;
        req.admin = {
            id: user._id,
            role: role,
            townSlug: townSlug,
            isSuper: role === "super_admin"
        };

        next();

    } catch (e) {
        console.error("adminAuth Error:", e.message);
        console.error(e); // Added full stack trace
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
