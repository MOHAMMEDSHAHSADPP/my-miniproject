// back/Controllers/ResidentAnalyticsController.js
const RTicket = require("../Models/RTicket");
const RComplaint = require("../Models/RComplaint");
const RMarketOrder = require("../Models/RMarketOrder");
const RServiceRequest = require("../Models/RServiceRequest");
const User = require("../Models/User");

// helper - supports adminAuth
function townSlugFromUser(req) {
  // 1. If super_admin, allow query param override
  if (req.admin?.isSuper && req.query.townSlug) {
    return String(req.query.townSlug).trim().toLowerCase();
  }
  // 2. If valid admin with townSlug
  if (req.admin?.townSlug) {
    return String(req.admin.townSlug).trim().toLowerCase();
  }
  // 3. Fallback to user object (legacy)
  return String(req.user?.townSlug || req.user?.townName || "").trim().toLowerCase();
}

/* =========================================================
   📊 SUMMARY
========================================================= */
exports.summary = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req);
    if (!townSlug) return res.status(400).json({ message: "User townSlug missing" });

    const [openComplaints, openTickets, openServiceRequests, totalUsers] = await Promise.all([
      RComplaint.countDocuments({ townSlug, status: { $ne: "resolved" } }),
      RTicket.countDocuments({ townSlug, status: { $ne: "closed" } }),
      RServiceRequest.countDocuments({ townSlug, status: { $ne: "resolved" } }),
      User.countDocuments({ townSlug, isAdmin: false }),
    ]);

    res.json({
      townSlug,
      counts: {
        openComplaints,
        openTickets,
        openServiceRequests,
        totalUsers,
      },
    });
  } catch (e) {
    res.status(500).json({ message: "Analytics summary failed", error: e.message });
  }
};

/* =========================================================
   🧾 COMPLAINTS BY WARD
========================================================= */
exports.complaintsByWard = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req);
    const data = await RComplaint.aggregate([
      { $match: { townSlug } },
      { $group: { _id: "$ward", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.json(
      data.map((x) => ({
        ward: x._id || "Unknown",
        total: x.total,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: "complaintsByWard failed", error: e.message });
  }
};

/* =========================================================
   👥 ACTIVE USERS (simple metric)
========================================================= */
// If you don't track lastLogin, this returns just total users.
// If you later add User.lastLoginAt you can filter by last 7 days.
exports.activeUsers = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req);
    const totalUsers = await User.countDocuments({ townSlug, isAdmin: false });
    res.json({ townSlug, activeUsers: totalUsers });
  } catch (e) {
    res.status(500).json({ message: "activeUsers failed", error: e.message });
  }
};

/* =========================================================
   🛒 MARKET STATS
========================================================= */
exports.marketStats = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req);

    const orders = await RMarketOrder.find({ townSlug }).lean();
    const totalOrders = orders.length;

    // your order schema may use status like: pending/accepted/delivered/cancelled
    const delivered = orders.filter((o) => o.status === "delivered").length;

    const revenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);

    res.json({ townSlug, totalOrders, delivered, revenue });
  } catch (e) {
    res.status(500).json({ message: "marketStats failed", error: e.message });
  }
};

/* =========================================================
   🧰 SERVICE REQUEST STATS
========================================================= */
exports.serviceStats = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req);

    const data = await RServiceRequest.aggregate([
      { $match: { townSlug } },
      { $group: { _id: "$type", total: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.json(
      data.map((x) => ({
        type: x._id || "other",
        total: x.total,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: "serviceStats failed", error: e.message });
  }
};