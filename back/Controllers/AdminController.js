// back/Controllers/AdminController.js
const User = require("../Models/User");
const ResidentRegistry = require("../Models/ResidentRegistry");

// Visitor models (use your existing names)
// Visitor models (use your existing names)
const Town = require("../Models/Town");
const Trending = require("../Models/Trending");
const Announcement = require("../Models/Announcement");
const Place = require("../Models/Place");
const Emergency = require("../Models/Emergency");
const Travel = require("../Models/Travel");
const VisitorComplaint = require("../Models/Complaint");

function isSuper(req) {
  return req.user?.role === "super_admin";
}
function townFilter(req) {
  if (isSuper(req)) return {};
  return { townSlug: req.user.townSlug };
}

/* ---------------- Resident DB ---------------- */
exports.registryList = async (req, res) => {
  try {
    const { q = "", claimed = "", townName = "" } = req.query;
    const filter = { ...townFilter(req) };

    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { houseNo: { $regex: q, $options: "i" } },
        { ward: { $regex: q, $options: "i" } },
        { voterId: { $regex: q, $options: "i" } },
      ];
    }
    if (claimed === "true" || claimed === "false") {
      filter.isClaimed = claimed === "true";
    }
    if (townName) {
      filter.townName = { $regex: `^${townName}$`, $options: "i" };
    }

    const rows = await ResidentRegistry.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("registryList:", e);
    res.status(500).json({ message: "Failed to load records" });
  }
};

exports.registryCreate = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!isSuper(req)) {
      body.townSlug = req.user.townSlug;
      body.townName = req.user.townName;
    }
    const row = await ResidentRegistry.create(body);
    res.status(201).json(row);
  } catch (e) {
    console.error("registryCreate:", e);
    res.status(500).json({ message: "Add failed" });
  }
};

exports.registryUpdate = async (req, res) => {
  try {
    const row = await ResidentRegistry.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Record not found" });

    if (!isSuper(req) && row.townSlug !== req.user.townSlug) {
      return res.status(403).json({ message: "Forbidden" });
    }

    Object.assign(row, req.body);
    await row.save();
    res.json(row);
  } catch (e) {
    console.error("registryUpdate:", e);
    res.status(500).json({ message: "Update failed" });
  }
};

exports.registryDelete = async (req, res) => {
  try {
    const row = await ResidentRegistry.findById(req.params.id);
    if (!row) return res.status(404).json({ message: "Record not found" });

    if (!isSuper(req) && row.townSlug !== req.user.townSlug) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await row.deleteOne();
    res.json({ ok: true });
  } catch (e) {
    console.error("registryDelete:", e);
    res.status(500).json({ message: "Delete failed" });
  }
};

/* ---------------- Users ---------------- */
exports.usersList = async (req, res) => {
  try {
    const filter = {};
    if (!isSuper(req)) filter.townSlug = req.user.townSlug;

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (e) {
    console.error("usersList:", e);
    res.status(500).json({ message: "Failed to load users" });
  }
};

exports.banUser = async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: "User not found" });

    if (!isSuper(req) && u.townSlug !== req.user.townSlug) {
      return res.status(403).json({ message: "Forbidden" });
    }

    u.isBanned = true;
    await u.save();
    res.json({ ok: true });
  } catch (e) {
    console.error("banUser:", e);
    res.status(500).json({ message: "Ban failed" });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return res.status(404).json({ message: "User not found" });

    if (!isSuper(req) && u.townSlug !== req.user.townSlug) {
      return res.status(403).json({ message: "Forbidden" });
    }

    u.isBanned = false;
    await u.save();
    res.json({ ok: true });
  } catch (e) {
    console.error("unbanUser:", e);
    res.status(500).json({ message: "Unban failed" });
  }
};

/* ---------------- Visitor admin (basic set your dashboard uses) ---------------- */
exports.listTowns = async (req, res) => {
  try {
    const filter = isSuper(req) ? {} : { townSlug: req.user.townSlug };
    const rows = await Town.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("listTowns:", e);
    res.status(500).json({ message: "Failed to load towns" });
  }
};

// add all your existing visitor handlers here OR keep in VisitorAdminController
// If already present there, keep there. This file is mainly for resident admin endpoints.