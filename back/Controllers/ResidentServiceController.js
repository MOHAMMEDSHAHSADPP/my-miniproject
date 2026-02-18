// back/Controllers/ResidentServiceController.js
// ─── COMPLETELY REWRITTEN — every handler wrapped in try/catch ───

const RServiceRequest = require("../Models/RServiceRequest");
const RMapMarker = require("../Models/RMapMarker");
const RWorkItem = require("../Models/RWorkItem");
const RPoll = require("../Models/RPoll");
const RRating = require("../Models/RRating");
const RBudgetDoc = require("../Models/RBudgetDoc");
const User = require("../Models/User");

function ts(user) {
  return String(user?.townSlug || user?.townName || "").trim().toLowerCase();
}

// ═══════════════ SERVICE REQUESTS ═══════════════
exports.listMyRequests = async (req, res) => {
  try {
    const items = await RServiceRequest.find({ townSlug: ts(req.user), userId: req.user._id })
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error("[listMyRequests]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const type = String(req.body.type || "").trim();
    const details = String(req.body.details || "").trim();
    if (!type) return res.status(400).json({ message: "type required" });

    const item = await RServiceRequest.create({
      townSlug: ts(req.user), ward: req.user.ward || "",
      userId: req.user._id, type, details, status: "open",
      history: [{ status: "open", by: "resident", at: new Date() }],
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("[createRequest]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.getRequest = async (req, res) => {
  try {
    const item = await RServiceRequest.findOne({
      _id: req.params.id, townSlug: ts(req.user), userId: req.user._id,
    }).lean();
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (e) {
    console.error("[getRequest]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════ MAP MARKERS ═══════════════
exports.listMarkers = async (req, res) => {
  try {
    const items = await RMapMarker.find({ townSlug: ts(req.user), isActive: true })
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error("[listMarkers]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════ WORKS ═══════════════
exports.listWorks = async (req, res) => {
  try {
    const items = await RWorkItem.find({ townSlug: ts(req.user) })
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error("[listWorks]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════ VOLUNTEERS ═══════════════
exports.getMyVolunteerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name ward townSlug volunteer").lean();
    res.json(user?.volunteer || null);
  } catch (e) {
    console.error("[getMyVolunteerProfile]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.registerVolunteer = async (req, res) => {
  try {
    const skills = Array.isArray(req.body.skills)
      ? req.body.skills
      : String(req.body.skills || "").split(",").map(s => s.trim()).filter(Boolean);
    const availability = String(req.body.availability || "").trim();
    const description = String(req.body.description || "").trim();
    const age = Number(req.body.age) || 0;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.volunteer = { skills, availability, description, age, isActive: true, updatedAt: new Date() };
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    console.error("[registerVolunteer]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════ POLLS ═══════════════
exports.listPolls = async (req, res) => {
  try {
    const items = await RPoll.find({ townSlug: ts(req.user), isActive: true })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (e) {
    console.error("[listPolls]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.votePoll = async (req, res) => {
  try {
    const pollId = req.params.pollId;
    const optionIndex = Number(req.body.optionIndex);

    const poll = await RPoll.findOne({ _id: pollId, townSlug: ts(req.user), isActive: true });
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    // Use votedUsers from schema
    if ((poll.votedUsers || []).some(uid => String(uid) === String(req.user._id)))
      return res.status(400).json({ message: "You already voted" });

    if (!poll.options || optionIndex < 0 || optionIndex >= poll.options.length)
      return res.status(400).json({ message: "Invalid option" });

    poll.votedUsers.push(req.user._id);
    poll.options[optionIndex].votes = (poll.options[optionIndex].votes || 0) + 1;
    await poll.save();
    res.json({ ok: true });
  } catch (e) {
    console.error("[votePoll]", e);
    res.status(500).json({ message: "Vote failed" });
  }
};

// ═══════════════ RATINGS ═══════════════
exports.listMyRatings = async (req, res) => {
  try {
    const items = await RRating.find({ townSlug: ts(req.user), userId: req.user._id })
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error("[listMyRatings]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.createRating = async (req, res) => {
  try {
    const targetType = String(req.body.targetType || "").trim();
    const targetId = String(req.body.targetId || "").trim();
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim();

    if (!targetType || !targetId) return res.status(400).json({ message: "targetType + targetId required" });
    if (!(rating >= 1 && rating <= 5)) return res.status(400).json({ message: "rating 1-5" });

    const item = await RRating.create({
      townSlug: ts(req.user), userId: req.user._id,
      targetType, targetId, rating, comment,
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("[createRating]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════ BUDGET DOCS ═══════════════
exports.listBudgetDocs = async (req, res) => {
  try {
    const items = await RBudgetDoc.find({ townSlug: ts(req.user), isActive: true })
      .sort({ createdAt: -1 }).limit(50).lean();
    res.json(items);
  } catch (e) {
    console.error("[listBudgetDocs]", e);
    res.status(500).json({ message: "Failed" });
  }
};