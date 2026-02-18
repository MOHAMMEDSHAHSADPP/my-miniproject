// back/Controllers/ResidentPublicController.js
// ─── COMPLETELY REWRITTEN — every handler wrapped in try/catch ───

const User = require("../Models/User");
const RNotification = require("../Models/RNotification");
const RAlert = require("../Models/RAlert");
const REvent = require("../Models/REvent");
const RDocument = require("../Models/RDocument");
const RDirectoryEntry = require("../Models/RDirectoryEntry");
const GovNotice = require("../Models/GovNotice");
const RComplaint = require("../Models/RComplaint");

// utilities — safe wrappers
const { notifyUser } = require("../utils/notify");
const { audit } = require("../utils/audit");

// ─── helpers ───
function townSlug(user) {
  return String(user?.townSlug || user?.townName || "").trim().toLowerCase();
}

function uploadPath(file) {
  return file ? `/uploads/resident/${file.filename}` : "";
}

// ═══════════════════ HOME DASHBOARD ═══════════════════
exports.home = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    if (!ts) return res.status(400).json({ message: "User townSlug missing" });

    const [topNotif, topAlert, unreadCount, notices] = await Promise.all([
      RNotification.findOne({ townSlug: ts, userId: req.user._id, isRead: false, priority: "critical" })
        .sort({ createdAt: -1 }).lean().catch(() => null),
      RAlert.findOne({ townSlug: ts, isActive: true, priority: "critical" })
        .sort({ createdAt: -1 }).lean().catch(() => null),
      RNotification.countDocuments({ townSlug: ts, userId: req.user._id, isRead: false }).catch(() => 0),
      GovNotice.find({ townSlug: ts, isActive: true }).sort({ createdAt: -1 }).limit(3).lean().catch(() => []),
    ]);

    res.json({
      townSlug: ts,
      welcome: { name: req.user.name, ward: req.user.ward || "" },
      unreadCount,
      notices, // Return notices
      shownOnLogin: topNotif
        ? { type: "notification", item: topNotif }
        : topAlert
          ? { type: "alert", item: topAlert }
          : null,
    });
  } catch (e) {
    console.error("[home]", e);
    res.status(500).json({ message: "Home failed" });
  }
};

// ═══════════════════ NOTIFICATIONS ═══════════════════
exports.notificationsList = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const items = await RNotification.find({ townSlug: ts, userId: req.user._id })
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error("[notificationsList]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.notificationsUnreadCount = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const count = await RNotification.countDocuments({ townSlug: ts, userId: req.user._id, isRead: false });
    res.json({ unread: count });
  } catch (e) {
    console.error("[notificationsUnreadCount]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.notificationMarkRead = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const n = await RNotification.findOne({ _id: req.params.id, townSlug: ts, userId: req.user._id });
    if (!n) return res.status(404).json({ message: "Not found" });
    n.isRead = true;
    n.readAt = new Date();
    await n.save();
    res.json({ ok: true });
  } catch (e) {
    console.error("[notificationMarkRead]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.notificationsMarkAllRead = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    await RNotification.updateMany(
      { townSlug: ts, userId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error("[notificationsMarkAllRead]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════════ ALERTS ═══════════════════
exports.alertsList = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const items = await RAlert.find({ townSlug: ts, isActive: true })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (e) {
    console.error("[alertsList]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════════ EVENTS ═══════════════════
exports.eventsList = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const items = await REvent.find({ townSlug: ts, isActive: true })
      .sort({ eventDate: 1, createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (e) {
    console.error("[eventsList]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.eventRSVP = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const { status } = req.body;
    if (!["going", "interested", "not_going"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const ev = await REvent.findOne({ _id: req.params.id, townSlug: ts });
    if (!ev) return res.status(404).json({ message: "Event not found" });

    ev.rsvp = (ev.rsvp || []).filter(r => String(r.user) !== String(req.user._id));
    if (status !== "not_going") ev.rsvp.push({ user: req.user._id, status });
    await ev.save();

    res.json({ ok: true });
  } catch (e) {
    console.error("[eventRSVP]", e);
    res.status(500).json({ message: "RSVP failed" });
  }
};

// ═══════════════════ GOVERNMENT NOTICES ═══════════════════
exports.govNoticesList = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const items = await GovNotice.find({ townSlug: ts, isActive: true })
      .sort({ deadline: 1, createdAt: -1 }).limit(100).lean();

    const enriched = items.map(n => ({
      ...n,
      acknowledged: (n.acknowledgedBy || []).some(id => String(id) === String(req.user._id)),
    }));
    res.json(enriched);
  } catch (e) {
    console.error("[govNoticesList]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.govNoticeMarkDone = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const item = await GovNotice.findOne({ _id: req.params.id, townSlug: ts });
    if (!item) return res.status(404).json({ message: "Not found" });

    item.acknowledgedBy = item.acknowledgedBy || [];
    if (!item.acknowledgedBy.some(u => String(u) === String(req.user._id)))
      item.acknowledgedBy.push(req.user._id);
    await item.save();
    res.json({ ok: true, acknowledged: true });
  } catch (e) {
    console.error("[govNoticeMarkDone]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════════ SUGGESTIONS ═══════════════════
exports.createSuggestion = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ message: "message required" });

    const item = await RComplaint.create({
      townSlug: ts, ward: req.user.ward || "",
      userId: req.user._id, type: "suggestion", message, status: "open",
    });
    res.status(201).json(item);
  } catch (e) {
    console.error("[createSuggestion]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.listMySuggestions = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const items = await RComplaint.find({ townSlug: ts, userId: req.user._id, type: "suggestion" })
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error("[listMySuggestions]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════════ FEED ═══════════════════
exports.feedListApproved = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    // Feed posts stored as RAlert with kind=feed_post — but RAlert schema has no "kind" field.
    // Return empty array gracefully instead of crashing.
    const items = await RAlert.find({
      townSlug: ts, isActive: true,
    }).sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (e) {
    console.error("[feedListApproved]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.feedSubmit = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const text = String(req.body.text || "").trim();
    const image = req.file ? uploadPath(req.file) : "";
    if (!text && !image) return res.status(400).json({ message: "text or image required" });

    const item = await RAlert.create({
      townSlug: ts, type: "info", title: "Resident post",
      message: text, priority: "normal", isActive: true,
      ward: req.user.ward || "", createdBy: req.user._id,
    });

    try { await notifyUser(req.user._id, { title: "Post submitted", message: "Waiting for approval.", townSlug: ts }); } catch (_) { }
    res.status(201).json(item);
  } catch (e) {
    console.error("[feedSubmit]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════════ DOCUMENTS ═══════════════════
exports.docsListMine = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const items = await RDocument.find({ townSlug: ts, userId: req.user._id })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json(items);
  } catch (e) {
    console.error("[docsListMine]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.docsUpload = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const docType = String(req.body.docType || "").trim();
    if (!docType) return res.status(400).json({ message: "docType required" });
    if (!req.file) return res.status(400).json({ message: "file required" });

    const item = await RDocument.create({
      townSlug: ts, userId: req.user._id, docType,
      fileUrl: uploadPath(req.file), status: "uploaded", isDemo: true,
    });
    try { await audit(req, "resident.upload_document", { docType }); } catch (_) { }
    res.status(201).json(item);
  } catch (e) {
    console.error("[docsUpload]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════════ DIRECTORY ═══════════════════
exports.directorySearch = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const q = String(req.query.q || "").trim();
    const category = String(req.query.category || "").trim();
    const filter = { townSlug: ts, isActive: true };
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { name: new RegExp(q, "i") },
        { tags: { $in: [new RegExp(q, "i")] } },
        { category: new RegExp(q, "i") },
      ];
    }
    const items = await RDirectoryEntry.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    res.json(items);
  } catch (e) {
    console.error("[directorySearch]", e);
    res.status(500).json({ message: "Failed" });
  }
};

// ═══════════════════ CHATBOT ═══════════════════
// ═══════════════════ CHATBOT ═══════════════════
exports.chatbot = async (req, res) => {
  try {
    const ts = townSlug(req.user);
    const textRaw = (req.body.message || "").toString().trim();
    if (!textRaw) return res.status(400).json({ reply: "Please type a message." });
    const text = textRaw.toLowerCase();

    // 1. Check Admin-added Info (TownInfo)
    const TownInfo = require("../Models/TownInfo"); // Lazy load
    const infos = await TownInfo.find({ townSlug: ts, isActive: true }).lean();
    infos.sort((a, b) => b.keyword.length - a.keyword.length);
    const match = infos.find(i => text.includes(i.keyword));
    if (match) return res.json({ reply: match.content });

    // 2. Standard Hardcoded Logic
    if (text.includes("time")) {
      const time = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "medium" }).format(new Date());
      return res.json({ reply: `Current time (IST): ${time}` });
    }
    if (text.includes("date") || text.includes("day") || text.includes("today")) {
      const date = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full" }).format(new Date());
      return res.json({ reply: `Today (IST): ${date}` });
    }

    // Announcements
    if (text.includes("announcement") || text.includes("notice") || text.includes("event")) {
      const [notices, events] = await Promise.all([
        GovNotice.find({ townSlug: ts, isActive: true }).sort({ createdAt: -1 }).limit(3).lean(),
        REvent.find({ townSlug: ts, isActive: true }).sort({ eventDate: 1 }).limit(3).lean(),
      ]);
      let reply = "";
      if (notices.length) reply += "📢 Notices:\n" + notices.map(n => `• ${n.title}`).join("\n") + "\n";
      if (events.length) reply += "\n📅 Events:\n" + events.map(e => `• ${e.title} (${new Date(e.eventDate).toLocaleDateString()})`).join("\n");

      return res.json({ reply: reply || "No recent announcements or upcoming events." });
    }

    // Emergency
    if (text.includes("emergency") || text.includes("police") || text.includes("ambulance") || text.includes("fire")) {
      const Emergency = require("../Models/Emergency");
      const nums = await Emergency.find({ townSlug: ts, isActive: true }).sort({ createdAt: -1 }).limit(6).lean();
      if (!nums.length) return res.json({ reply: "No emergency numbers added yet." });
      return res.json({ reply: nums.map((n) => `• ${n.label}: ${n.number}`).join("\n") });
    }

    // Services / Directory Search
    const catMap = [
      { key: "plumber", cat: "plumber" }, { key: "electrician", cat: "electrician" },
      { key: "carpenter", cat: "carpenter" }, { key: "hospital", cat: "hospital" },
      { key: "shop", cat: "shop" }, { key: "restaurant", cat: "restaurant" },
    ];
    const found = catMap.find(c => text.includes(c.key));
    if (found) {
      const items = await RDirectoryEntry.find({ townSlug: ts, category: found.cat, isActive: true })
        .sort({ createdAt: -1 }).limit(5).lean();
      if (!items.length) return res.json({ reply: `No ${found.key} entries found in directory.` });
      const lines = items.map(i => `• ${i.name}${i.phone ? " — " + i.phone : ""}`);
      return res.json({ reply: `Here are some ${found.key} contacts:\n${lines.join("\n")}` });
    }

    // Fallback directory search
    const items = await RDirectoryEntry.find({
      townSlug: ts, isActive: true,
      $or: [{ name: new RegExp(textRaw, "i") }, { tags: { $in: [new RegExp(textRaw, "i")] } }],
    }).sort({ createdAt: -1 }).limit(5).lean();

    if (items.length) {
      const lines = items.map(i => `• ${i.name} (${i.category})${i.phone ? " — " + i.phone : ""}`);
      return res.json({ reply: `I found these contacts:\n${lines.join("\n")}` });
    }

    res.json({ reply: "I'm not sure. Try asking for: time, date, announcements, emergency, plumber, electrician, etc." });
  } catch (e) {
    console.error("[chatbot]", e);
    res.status(500).json({ reply: "Bot error." });
  }
};

// ═══════════════════ PROFILE ═══════════════════
exports.getProfile = async (req, res) => {
  try {
    const safe = await User.findById(req.user._id).select("-password").lean();
    res.json(safe);
  } catch (e) {
    console.error("[getProfile]", e);
    res.status(500).json({ message: "Failed" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "ward", "phone", "address"];
    const patch = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) patch[k] = req.body[k]; });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    Object.keys(patch).forEach(k => (user[k] = patch[k]));
    await user.save();
    try { await audit(req, "resident.update_profile", { fields: Object.keys(patch) }); } catch (_) { }
    res.json({ ok: true });
  } catch (e) {
    console.error("[updateProfile]", e);
    res.status(500).json({ message: "Failed" });
  }
};
