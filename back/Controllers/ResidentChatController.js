// back/Controllers/ResidentChatController.js
const User = require("../Models/User");
const RMessage = require("../Models/RMessage");
const RChatRoom = require("../Models/RChatRoom");

function townSlugFromUser(user) {
  return String(user?.townSlug || user?.townName || "").trim().toLowerCase();
}

async function getOrCreateRoom(townSlug, scope, ward = "", dmOtherUserId = null, currentUserId = null) {
  let query = { townSlug };
  let creationExtra = {};

  if (scope === "ward") {
    if (!ward) throw new Error("Ward is required for ward chat");
    query.scope = "ward";
    query.ward = ward;
  } else if (scope === "town") {
    query.scope = "town";
  } else if (scope === "dm") {
    if (!dmOtherUserId || !currentUserId) throw new Error("Users required for DM");
    query.scope = "dm";
    const ids = [String(currentUserId), String(dmOtherUserId)].sort();
    query.dmKey = `${ids[0]}:${ids[1]}`;
    creationExtra.members = [currentUserId, dmOtherUserId];
  } else if (scope === "admin") {
    // Admin Support: Use "custom" scope with unique name
    if (!currentUserId) throw new Error("User required for Admin Support chat");
    query.scope = "custom";
    query.name = `AdminSupport:${currentUserId}`;
    creationExtra.members = [currentUserId];
  } else {
    // Default fallback (custom rooms passed directly?)
    query.scope = scope;
  }

  let room = await RChatRoom.findOne(query);
  if (!room) {
    try {
      room = await RChatRoom.create({ ...query, ...creationExtra });
    } catch (createErr) {
      // Handle duplicate key race condition — another request may have created it
      if (createErr.code === 11000) {
        room = await RChatRoom.findOne(query);
        if (!room) throw new Error("Failed to create or find chat room after duplicate key error");
      } else {
        throw createErr;
      }
    }
  }
  return room;
}

// ========== UNIFIED CHAT ENDPOINTS ==========

// GET /resident/chat?room={ward|town|admin|dm}&otherUserId={id}
exports.listMessages = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);
    if (!townSlug) {
      return res.status(400).json({ message: "User is not assigned to a town (townSlug missing)" });
    }

    const { room: roomType, otherUserId } = req.query;

    // Frontend sends "ward", "town", "admin".
    // If "admin", we treat it special.

    let scope = roomType;
    let ward = "";
    let dmOtherId = null;

    if (roomType === "ward") {
      ward = req.user.ward;
    } else if (roomType === "town") {
      // scope is town
    } else if (roomType === "admin") {
      // map to custom/admin logic
    } else if (roomType === "dm") {
      dmOtherId = otherUserId;
    }

    // Resolve room
    const room = await getOrCreateRoom(townSlug, scope, ward, dmOtherId, req.user._id);

    const match = {
      roomId: room._id,
      hiddenFor: { $ne: req.user._id },
    };

    const items = await RMessage.find(match)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("senderId", "name ward")
      .lean();

    res.json(items.reverse());
  } catch (e) {
    console.error("LIST MESSAGES ERROR", e);
    res.status(500).json({ message: "Failed to load messages", error: e.message });
  }
};

// POST /resident/chat
exports.sendMessage = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);
    const { room: roomType, message, type, otherUserId } = req.body;

    // Fix: Allow empty message if there is an image
    if (!message && !req.file) return res.status(400).json({ message: "Message or image is required" });

    let scope = roomType;
    let ward = "";
    let dmOtherId = null;

    if (roomType === "ward") ward = req.user.ward;
    else if (roomType === "dm") dmOtherId = otherUserId;

    const room = await getOrCreateRoom(townSlug, scope, ward, dmOtherId, req.user._id);

    // Handle image
    let image = "";
    if (req.file) {
      image = "/uploads/resident/" + req.file.filename;
    }

    const msg = await RMessage.create({
      townSlug,
      roomId: room._id,
      senderId: req.user._id,
      text: message || "", // Allow empty text if image exists
      type: image ? "image" : (type || "text"),
      image: image,
    });

    // Populate for immediate return
    await msg.populate("senderId", "name ward");

    res.status(201).json(msg);
  } catch (e) {
    console.error("SEND MESSAGE ERROR", e);
    res.status(500).json({ message: "Failed to send message" });
  }
};


// ========== OLD HANDLERS (Keep quirks if needed or redirect?) ==========
// To be safe, I will comment them out or leave them if other routes still use them.
// The new routes override the old ones in ResidentPublicRoutes.js if I change them there.
// But some old dedicated routes like /dm/:id might still be called? 
// The implementation plan says "Deprecate...". I will remove them to avoid confusion 
// and force usage of the new unified controllers if I update the routes file completely.
// But I should check if I missed any functionality like "report" or "deleteForMe".

// ========== Delete for me ==========
exports.deleteForMe = async (req, res) => {
  try {
    const msg = await RMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    // schema uses "hiddenFor" not "deletedFor" based on RMessage.js I saw earlier?
    // Let's re-read RMessage.js
    // It has: hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // AND: deleteForMe in old code used "deletedFor". 
    // OLD CODE WAS WRONG compared to schema "hiddenFor" vs "deletedFor"?
    // I saw RMessage.js has: hiddenFor: [...]
    // Old controller used: msg.deletedFor
    // So old controller was likely failing or schema changed.
    // I will use `hiddenFor` consistent with schema.

    const uid = String(req.user._id);
    const list = msg.hiddenFor || [];
    if (!list.map(String).includes(uid)) {
      msg.hiddenFor.push(req.user._id);
      await msg.save();
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Delete failed", error: e.message });
  }
};

// ========== Report ==========
exports.reportMessage = async (req, res) => {
  try {
    const msg = await RMessage.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    // schema uses "reports": [ { byUserId, reason, createdAt } ]
    // old controller used "reportedBy": []
    // So old controller was likely broken or using different schema version.
    // I will use `reports` consistent with schema.

    const uid = String(req.user._id);
    const existing = msg.reports.find(r => String(r.byUserId) === uid);
    if (!existing) {
      msg.reports.push({ byUserId: req.user._id, reason: req.body.reason || "Reported" });
      msg.isReported = true;
      msg.reportCount = (msg.reportCount || 0) + 1;
      await msg.save();
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Report failed", error: e.message });
  }
};