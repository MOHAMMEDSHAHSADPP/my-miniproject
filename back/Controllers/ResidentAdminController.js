const ResidentRegistry = require("../Models/ResidentRegistry");
const User = require("../Models/User");
const slugify = require("slugify");
const RMessage = require("../Models/RMessage");
const RChatRoom = require("../Models/RChatRoom");
const REvent = require("../Models/REvent");
const RPoll = require("../Models/RPoll");
const RAlert = require("../Models/RAlert");
const RSuggestion = require("../Models/RSuggestion");
const RTicket = require("../Models/RTicket");
const RComplaint = require("../Models/RComplaint");
const RServiceRequest = require("../Models/RServiceRequest");
const RWorkItem = require("../Models/RWorkItem");
const RMapMarker = require("../Models/RMapMarker");
const RBudgetDoc = require("../Models/RBudgetDoc");
const RDirectory = require("../Models/RDirectoryEntry");
const RDirectoryEntry = RDirectory;
const RDocument = require("../Models/RDocument");
const RRating = require("../Models/RRating");
const RMarketProduct = require("../Models/RMarketProduct");
const RMarketOrder = require("../Models/RMarketOrder");
const RNotification = require("../Models/RNotification");
const GovNotice = require("../Models/GovNotice");

// Helper: Escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /admin/registry
exports.registryList = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const claimed = String(req.query.claimed || "").trim(); // "", "true", "false"
    const townName = String(req.query.townName || "").trim();

    const filter = {};

    // text search across expected fields
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [
        { fullName: rx },
        { houseNo: rx },
        { ward: rx },
        { voterId: rx },
        { townName: rx },
      ];
    }

    if (townName) {
      filter.townName = new RegExp(`^${escapeRegex(townName)}$`, "i");
    }

    if (claimed === "true") filter.isClaimed = true;
    if (claimed === "false") filter.isClaimed = false;

    // 3. Admin Scope Check
    // req.admin is populated by adminAuth middleware
    const { isSuper, townSlug } = req.admin || {};

    if (!isSuper) {
      // If not super admin, restrict to their town
      // If townSlug is missing, return empty list (per previous fix)
      if (!townSlug) return res.json([]);

      // Filter by townSlug
      filter.townSlug = new RegExp(`^${escapeRegex(townSlug)}$`, "i");
    }

    const rows = await ResidentRegistry.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(rows);
  } catch (err) {
    console.error("REGISTRY LIST ERROR:", err);
    console.error(err); // Full trace
    return res.status(500).json({ message: "Failed to load registry", error: err.message });
  }
};

// POST /admin/registry
exports.registryCreate = async (req, res) => {
  try {
    const payload = {
      fullName: String(req.body.fullName || "").trim(),
      houseNo: String(req.body.houseNo || "").trim(),
      ward: String(req.body.ward || "").trim(),
      dob: String(req.body.dob || "").trim(),
      familyHeadName: String(req.body.familyHeadName || "").trim(),
      voterId: String(req.body.voterId || "").trim(),
      townName: String(req.body.townName || "").trim(),
      townSlug: String(req.body.townSlug || "").trim(),
      isClaimed: false,
    };

    // Auto-generate slug if missing
    if (!payload.townSlug && payload.townName) {
      payload.townSlug = slugify(payload.townName, { lower: true, strict: true });
    }

    if (!payload.fullName || !payload.houseNo || !payload.ward || !payload.voterId || !payload.townName || !payload.townSlug) {
      return res.status(400).json({ message: "Missing required fields (including town)" });
    }

    const doc = await ResidentRegistry.create(payload);
    return res.status(201).json(doc);
  } catch (err) {
    console.error("REGISTRY CREATE ERROR:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate record: Voter ID already exists in this town." });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed", error: err.message });
    }
    return res.status(500).json({ message: "Failed to add registry record", error: err.message });
  }
};

// PATCH /admin/registry/:id
exports.registryUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    const updates = {
      fullName: req.body.fullName,
      houseNo: req.body.houseNo,
      ward: req.body.ward,
      dob: req.body.dob,
      familyHeadName: req.body.familyHeadName,
      voterId: req.body.voterId,
      townName: req.body.townName,
      townSlug: req.body.townSlug,
    };

    // Auto-update slug if townName changes
    if (updates.townName && !updates.townSlug) {
      updates.townSlug = slugify(updates.townName, { lower: true, strict: true });
    }

    Object.keys(updates).forEach((k) => {
      if (updates[k] === undefined) delete updates[k];
      else updates[k] = String(updates[k]).trim();
    });

    const row = await ResidentRegistry.findByIdAndUpdate(id, updates, { new: true });
    if (!row) return res.status(404).json({ message: "Record not found" });

    return res.json(row);
  } catch (err) {
    console.error("REGISTRY UPDATE ERROR:", err);
    return res.status(500).json({ message: "Failed to update registry" });
  }
};

// DELETE /admin/registry/:id
exports.registryDelete = async (req, res) => {
  try {
    const row = await ResidentRegistry.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ message: "Record not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("REGISTRY DELETE ERROR:", err);
    return res.status(500).json({ message: "Failed to delete registry" });
  }
};

// ============================================================================================
// IMPLEMENTATION OF MISSING HANDLERS
// ============================================================================================

const SuperAdmin = require("./AdminController");

// Proxy to AdminController
exports.usersList = SuperAdmin.usersList;
exports.banUser = SuperAdmin.banUser;
exports.unbanUser = SuperAdmin.unbanUser;

/* ================= NOTIFICATIONS ================= */

// POST /admin/notify/town
exports.broadcastTownNotification = async (req, res) => {
  try {
    const { title, message, priority, type, link } = req.body;
    let townSlug = req.body.townSlug;

    // If admin is town-scoped, enforce their town
    if (req.admin && !req.admin.isSuper) {
      townSlug = req.admin.townSlug;
    }

    if (!townSlug || !title || !message) {
      return res.status(400).json({ message: "Missing townSlug, title or message" });
    }

    // "userId: null" means broadcast to everyone in that town
    await RNotification.create({
      townSlug,
      userId: null,
      type: type || "info",
      priority: priority || "normal",
      title,
      message,
      link: link || "",
    });

    return res.json({ message: "Notification broadcasted" });
  } catch (err) {
    console.error("BROADCAST ERROR:", err);
    res.status(500).json({ message: "Failed to broadcast", error: err.message });
  }
};

/* ================= FEED MODERATION ================= */
exports.feedPending = async (req, res) => res.json([]);
exports.feedApprove = async (req, res) => res.json({ ok: true });
exports.feedReject = async (req, res) => res.json({ ok: true });

/* ================= CHAT (Admin Support) ================= */
exports.adminListRooms = async (req, res) => {
  try {
    const filter = {
      scope: "custom",
      name: { $regex: "^AdminSupport:" }
    };

    if (req.user && req.user.role === "town_admin") {
      filter.townSlug = req.user.townSlug;
    } else if (req.admin && !req.admin.isSuper) {
      filter.townSlug = req.admin.townSlug;
    } else if (req.query.townSlug) {
      filter.townSlug = req.query.townSlug;
    }

    const rooms = await RChatRoom.find(filter)
      .populate("members", "name email")
      .sort({ updatedAt: -1 })
      .lean();
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ message: "List rooms failed", error: e.message });
  }
};

exports.adminListMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const msgs = await RMessage.find({ roomId })
      .sort({ createdAt: 1 }) // Chronological for chat
      .populate("senderId", "name email role")
      .lean();
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ message: "List messages failed", error: e.message });
  }
};

exports.adminSendMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });

    const room = await RChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Admin sends message
    const msg = await RMessage.create({
      townSlug: room.townSlug,
      roomId,
      senderId: req.user._id,
      text: message,
      type: "text",
    });

    // Update room updatedAt
    await RChatRoom.findByIdAndUpdate(roomId, { updatedAt: new Date() });

    // Populate sender
    await msg.populate("senderId", "name");

    res.json(msg);
  } catch (e) {
    res.status(500).json({ message: "Send failed", error: e.message });
  }
};

exports.reportedMessagesList = async (req, res) => {
  try {
    const filter = { isReported: true };
    if (req.user.role === "town_admin") filter.townSlug = req.user.townSlug;

    const msgs = await RMessage.find(filter)
      .populate("senderId", "name")
      .sort({ reportCount: -1 })
      .lean();
    res.json(msgs);
  } catch (e) { res.status(500).json({ message: "List reports failed" }); }
};

exports.adminDeleteMessage = async (req, res) => {
  try {
    // Soft hide for everyone or mark as deleted by admin
    await RMessage.findByIdAndUpdate(req.params.id, {
      isHiddenByAdmin: true,
      hiddenReason: "Deleted by Admin",
      text: "[Deleted by Admin]",
      image: ""
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};

/* ================= ALERTS ================= */
// GET /admin/alerts
exports.alertsAdminList = async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : "";
    const filter = {};
    if (req.admin && !req.admin.isSuper) {
      filter.townSlug = req.admin.townSlug;
    } else if (req.query.townSlug) {
      filter.townSlug = req.query.townSlug;
    }

    if (q) {
      filter.title = new RegExp(escapeRegex(q), "i");
    }

    const rows = await RAlert.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Error loading alerts" });
  }
};

exports.createAlert = async (req, res) => {
  try {
    let { townSlug, title, message, type, priority, ward } = req.body;
    if (!townSlug && req.admin) townSlug = req.admin.townSlug || req.user?.townSlug || req.user?.adminTownSlug || "";
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    if (!townSlug || !title || !message || !type) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const alert = await RAlert.create({
      townSlug,
      title,
      message,
      type,
      priority,
      ward: ward || "", // optional
      createdBy: req.user._id,
    });

    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: "Create alert failed" });
  }
};

exports.updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await RAlert.findByIdAndUpdate(id, req.body, { new: true });
    res.json(alert);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    await RAlert.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};


/* ================= NOTICES ================= */
// GET /admin/notices
exports.noticesAdminList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await GovNotice.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.createNotice = async (req, res) => {
  try {
    console.log("=== CREATE NOTICE REQUEST ===");
    let { townSlug, title, description, priority, deadline } = req.body;
    if (!townSlug && req.admin) townSlug = req.admin.townSlug || req.user?.townSlug || req.user?.adminTownSlug || "";
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    if (!townSlug || !title) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const notice = await GovNotice.create({
      townSlug,
      title,
      description,
      priority,
      deadline,
    });
    console.log("✅ Notice created:", notice._id);
    res.status(201).json(notice);
  } catch (e) {
    console.error("❌ ADMIN OP ERROR (createNotice):", e);
    res.status(500).json({ message: "Create failed", error: e.message });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const item = await GovNotice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    await GovNotice.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};

exports.remindUnacknowledgedNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await GovNotice.findById(id);
    if (!notice) return res.status(404).json({ message: "Notice not found" });

    // Find all residents in this town
    const residents = await ResidentRegistry.find({ townSlug: notice.townSlug, isClaimed: true }).select("userId");

    // Filter out those who acked (acknowledgedBy matches userId or user object?)
    // acknowledgedBy is array of User ObjectIds. 
    // We need to find which Users are residents. 
    // Actually, simple way: User.find({ role: 'resident', townSlug: notice.townSlug })
    // But registry is better source of truth for "Residents". 
    // Let's assume User model has townSlug and role='resident'.

    const allResidents = await User.find({
      townSlug: notice.townSlug,
      role: "resident",
      _id: { $nin: notice.acknowledgedBy } // Exclude acknowledged
    });

    if (allResidents.length === 0) {
      return res.json({ message: "Everyone has already acknowledged." });
    }

    // Create notifications
    const notifs = allResidents.map(u => ({
      townSlug: notice.townSlug,
      userId: u._id,
      type: "alert", // or 'info'
      priority: "high",
      title: "Reminder: " + notice.title,
      message: "Please acknowledge this important government notice.",
      link: "/resident/notices" // pending page
    }));

    await RNotification.insertMany(notifs);

    res.json({ message: `Reminder sent to ${allResidents.length} residents.` });
  } catch (e) {
    console.error("REMIND ERROR:", e);
    res.status(500).json({ message: "Remind failed", error: e.message });
  }
};


/* ================= EVENTS ================= */
// GET /admin/events
exports.eventsAdminList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await REvent.find(filter).sort({ eventDate: 1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    console.log("=== CREATE EVENT REQUEST ===");
    let { townSlug, title, description, eventDate, ward } = req.body;
    if (!townSlug && req.admin) townSlug = req.admin.townSlug || req.user?.townSlug || req.user?.adminTownSlug || "";
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    if (!townSlug || !title || !eventDate) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Handle image upload
    let image = "";
    if (req.file) {
      // relative path for frontend
      image = "/uploads/resident/" + req.file.filename;
    }

    const createdById = req.user?._id || req.admin?.id;

    const eventData = {
      townSlug,
      title,
      description,
      eventDate,
      ward: ward || "",
      image,
    };

    if (createdById) {
      eventData.createdBy = createdById;
    }

    const evt = await REvent.create(eventData);
    res.status(201).json(evt);
  } catch (e) {
    console.error("❌ CREATE EVENT ERROR:", e);
    res.status(500).json({ message: "Create event failed", error: e.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.image = "/uploads/resident/" + req.file.filename;
    }
    const evt = await REvent.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(evt);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    await REvent.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};


/* ================= POLLS ================= */
// GET /admin/polls
exports.pollsAdminList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RPoll.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.createPoll = async (req, res) => {
  try {
    console.log("=== CREATE POLL REQUEST ===");
    console.log("Body:", JSON.stringify(req.body, null, 2));

    let { townSlug, question, options, expiresAt } = req.body;
    if (!townSlug && req.admin) townSlug = req.admin.townSlug || req.user?.townSlug || req.user?.adminTownSlug || "";
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    if (!townSlug || !question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Invalid poll data" });
    }

    let formattedOptions = options;
    if (typeof options[0] === "string") {
      formattedOptions = options.map(txt => ({ text: txt, votes: 0 }));
    }

    const createdById = req.user?._id || req.admin?.id;

    const pollData = {
      townSlug,
      question,
      options: formattedOptions,
      expiresAt: expiresAt || null,
    };

    if (createdById) {
      pollData.createdBy = createdById;
    }

    const poll = await RPoll.create(pollData);
    console.log("✅ Poll created:", poll._id);
    res.status(201).json(poll);
  } catch (e) {
    console.error("❌ CREATE POLL ERROR:", e);
    res.status(500).json({ message: "Create poll failed", error: e.message });
  }
};

exports.updatePoll = async (req, res) => {
  try {
    const poll = await RPoll.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(poll);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.deletePoll = async (req, res) => {
  try {
    await RPoll.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};

// ========== WORKS ==========
exports.worksList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RWorkItem.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("WORKS LIST ERROR:", e);
    res.status(500).json({ message: "Load failed", error: e.message });
  }
};

exports.createWorkItem = async (req, res) => {
  try {
    const { title, description, status, budget, deadline, category, mapLink } = req.body;
    let townSlug = req.body.townSlug;

    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;
    if (!townSlug) return res.status(400).json({ message: "Town required" });

    const payload = {
      townSlug,
      title,
      description,
      status: status || "planned",
      budget: Number(budget) || 0,
      deadline: deadline || null,
      category: category || "general",
      mapLink: mapLink || "",
      image: req.file ? `/uploads/resident/${req.file.filename}` : null,
      createdBy: req.user._id,
    };

    const item = await RWorkItem.create(payload);
    res.status(201).json(item);
  } catch (e) {
    console.error("CREATE WORK ERROR:", e);
    res.status(500).json({ message: "Create failed", error: e.message });
  }
};

exports.updateWorkItem = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `/uploads/resident/${req.file.filename}`;

    const item = await RWorkItem.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(item);
  } catch (e) {
    console.error("UPDATE WORK ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.deleteWorkItem = async (req, res) => {
  try {
    await RWorkItem.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("DELETE WORK ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};

/* ================= COMPLAINTS & SUGGESTIONS ================= */

exports.complaintsList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RComplaint.find(filter).populate("user", "name email").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const item = await RComplaint.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    res.json(item);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

// Suggestions
exports.suggestionsList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const items = await RSuggestion.find(filter).populate("user", "name").sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    console.error("Suggestions List Error:", e);
    res.status(500).json({ message: "List suggestions failed", error: e.message });
  }
};

exports.updateSuggestionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const item = await RSuggestion.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(item);
  } catch (e) {
    console.error("Suggestion Update Error:", e);
    res.status(500).json({ message: "Update suggestion failed", error: e.message });
  }
};

/* ================= TICKETS ================= */
exports.ticketsList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RTicket.find(filter).populate("user", "name email").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const item = await RTicket.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    res.json(item);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.replyTicket = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });

    const ticket = await RTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.messages = ticket.messages || [];
    ticket.messages.push({ sender: "admin", message, createdAt: new Date() });

    // Auto-update status to in_progress if open
    if (ticket.status === "open") ticket.status = "in_progress";

    await ticket.save();
    res.json(ticket);
  } catch (e) {
    console.error("ADMIN REPLY ERROR:", e);
    res.status(500).json({ message: "Reply failed", error: e.message });
  }
};


/* ================= SERVICE REQUESTS ================= */
exports.serviceRequestsList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RServiceRequest.find(filter).populate("user", "name email").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const reqItem = await RServiceRequest.findById(req.params.id);
    if (!reqItem) return res.status(404).json({ message: "Not found" });

    reqItem.status = status;
    reqItem.history.push({
      status,
      note,
      updatedBy: req.user._id,
      at: new Date(),
    });
    await reqItem.save();
    res.json(reqItem);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};


/* ================= DOCUMENTS ================= */
exports.documentsList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RDocument.find(filter).populate("user", "name email").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.requestDocument = async (req, res) => {
  try {
    // Admin creates a doc record with status='pending' and requestedByAdmin=true
    let { townSlug, userId, docType, requestNote } = req.body;
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    const doc = await RDocument.create({
      townSlug,
      user: userId,
      ward: "N/A", // placeholder
      docType,
      fileUrl: "pending",
      requestedByAdmin: true,
      requestNote,
      status: "pending",
    });
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ message: "Request failed" }); }
};

exports.deleteDocument = async (req, res) => {
  try {
    await RDocument.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};


/* ================= DIRECTORY ================= */
exports.directoryList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RDirectoryEntry.find(filter).sort({ name: 1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.addDirectoryEntry = async (req, res) => {
  try {
    let { townSlug, name, phone, category, ward, address, email } = req.body;
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    const entry = await RDirectoryEntry.create({
      townSlug,
      category: category || "other",
      name,
      phone,
      ward,
      address,
      createdBy: req.user._id,
      details: email ? `Email: ${email}` : ""
    });
    res.status(201).json(entry);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Create failed", error: e.message });
  }
};

exports.updateDirectoryEntry = async (req, res) => {
  try {
    const item = await RDirectoryEntry.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.deleteDirectoryEntry = async (req, res) => {
  try {
    await RDirectoryEntry.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};


/* ================= MAP MARKERS ================= */
exports.mapMarkersAdminList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RMapMarker.find(filter);
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.createMapMarker = async (req, res) => {
  try {
    let { townSlug, title, type, lat, lng, note } = req.body;
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    const marker = await RMapMarker.create({
      townSlug,
      title,
      type: type || "other",
      location: { lat, lng },
      description: note,
      createdBy: req.user._id,
    });
    res.status(201).json(marker);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Create failed", error: e.message });
  }
};

exports.updateMapMarker = async (req, res) => {
  try {
    const item = await RMapMarker.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Update failed", error: e.message });
  }
};

exports.deleteMapMarker = async (req, res) => {
  try {
    await RMapMarker.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};


/* ================= RATINGS ================= */
exports.ratingsSummary = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    // Just return raw list for now, or aggregation
    const rows = await RRating.find(filter).limit(100).sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};


/* ================= MARKET ================= */
exports.marketProductsAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RMarketProduct.find(filter).populate("sellerId", "name email").sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.marketApproveProduct = async (req, res) => {
  try {
    const p = await RMarketProduct.findByIdAndUpdate(req.params.id, { isApproved: true, isActive: true }, { new: true });
    res.json(p);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Approve failed", error: e.message });
  }
};

exports.marketRejectProduct = async (req, res) => {
  try {
    const p = await RMarketProduct.findByIdAndUpdate(req.params.id, { isApproved: false, isActive: false }, { new: true });
    res.json(p);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Reject failed", error: e.message });
  }
};

exports.marketDeleteProduct = async (req, res) => {
  try {
    await RMarketProduct.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};

exports.marketOrdersAdmin = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RMarketOrder.find(filter)
      .populate("productId")
      .populate("sellerId", "name")
      .populate("buyerId", "name")
      .sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) { res.status(500).json({ message: "List orders failed" }); }
};

exports.marketUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await RMarketOrder.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(order);
  } catch (e) { res.status(500).json({ message: "Update status failed" }); }
};


/* ================= BUDGET ================= */
exports.budgetDocsList = async (req, res) => {
  try {
    const filter = {};
    if (req.admin && !req.admin.isSuper) filter.townSlug = req.admin.townSlug;
    else if (req.query.townSlug) filter.townSlug = req.query.townSlug;

    const rows = await RBudgetDoc.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (e) {
    console.error("ADMIN OP ERROR:", e);
    res.status(500).json({ message: "Operation failed", error: e.message });
  }
};

exports.createBudgetEntry = async (req, res) => {
  try {
    let { townSlug, title, amount, type, date, note } = req.body;
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    if (!townSlug || !title || !amount) return res.status(400).json({ message: "Missing fields" });

    const entry = await RBudgetDoc.create({
      townSlug,
      title,
      description: `${type || 'expense'}: ${note || ''}`,
      year: date || new Date().toISOString().split('T')[0],
      fileUrl: `amount:${amount}|type:${type || 'expense'}`, // Store metadata in fileUrl
      uploadedBy: req.user._id,
    });
    res.status(201).json(entry);
  } catch (e) {
    console.error("CREATE BUDGET ENTRY ERROR:", e);
    res.status(500).json({ message: "Create failed", error: e.message });
  }
};

exports.uploadBudgetDoc = async (req, res) => {
  try {
    let { townSlug, title, description, year } = req.body;
    if (req.admin && !req.admin.isSuper) townSlug = req.admin.townSlug;

    if (!townSlug || !title) return res.status(400).json({ message: "Missing fields" });

    let fileUrl = "";
    if (req.file) {
      fileUrl = "/uploads/resident/" + req.file.filename;
    }

    const doc = await RBudgetDoc.create({
      townSlug,
      title,
      description,
      year,
      fileUrl,
      uploadedBy: req.user._id,
    });
    res.status(201).json(doc);
  } catch (e) { res.status(500).json({ message: "Upload failed" }); }
};

exports.deleteBudgetDoc = async (req, res) => {
  try {
    await RBudgetDoc.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ message: "Delete failed" }); }
};