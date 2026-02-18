// back/Controllers/ResidentChatController.js
const User = require("../Models/User");
const RChatRoom = require("../Models/RChatRoom");
const RMessage = require("../Models/RMessage");

/* =========================
   HELPERS
========================= */
function scope(req) {
  return {
    townSlug: req.user?.townSlug || "",
    ward: req.user?.ward || "",
  };
}

function sameId(a, b) {
  return String(a) === String(b);
}

/* =========================
   LIST ROOMS for user
========================= */
exports.listRooms = async (req, res) => {
  try {
    const { townSlug, ward } = scope(req);
    if (!townSlug) return res.status(400).json({ message: "User town not set" });

    const rooms = await RChatRoom.find({
      townSlug,
      members: req.user._id,
    })
      .sort({ updatedAt: -1 })
      .lean();

    // also ensure user always has town & ward default rooms
    // (frontend can call createRoom, but we auto-create here too)
    const needTown = !rooms.some((r) => r.type === "town");
    const needWard = ward && !rooms.some((r) => r.type === "ward" && r.ward === ward);

    if (needTown) {
      await RChatRoom.create({
        townSlug,
        type: "town",
        title: `Town Chat`,
        members: [req.user._id],
      });
    }
    if (needWard) {
      await RChatRoom.create({
        townSlug,
        type: "ward",
        ward,
        title: `Ward ${ward} Chat`,
        members: [req.user._id],
      });
    }

    const rooms2 = await RChatRoom.find({ townSlug, members: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    res.json(rooms2);
  } catch (e) {
    res.status(500).json({ message: "List rooms failed", error: e.message });
  }
};

/* =========================
   CREATE ROOM
   type: "town" | "ward" | "dm"
========================= */
exports.createRoom = async (req, res) => {
  try {
    const { townSlug, ward } = scope(req);
    if (!townSlug) return res.status(400).json({ message: "User town not set" });

    const { type, otherUserId, title } = req.body;
    const t = (type || "").toLowerCase();

    if (!["town", "ward", "dm"].includes(t)) {
      return res.status(400).json({ message: "Invalid room type" });
    }

    // Town room: single per town (per user membership)
    if (t === "town") {
      let room = await RChatRoom.findOne({ townSlug, type: "town", members: req.user._id });
      if (!room) {
        room = await RChatRoom.create({
          townSlug,
          type: "town",
          title: "Town Chat",
          members: [req.user._id],
        });
      }
      return res.json(room);
    }

    // Ward room: single per ward
    if (t === "ward") {
      if (!ward) return res.status(400).json({ message: "User ward not set" });
      let room = await RChatRoom.findOne({ townSlug, type: "ward", ward, members: req.user._id });
      if (!room) {
        room = await RChatRoom.create({
          townSlug,
          type: "ward",
          ward,
          title: `Ward ${ward} Chat`,
          members: [req.user._id],
        });
      }
      return res.json(room);
    }

    // DM room
    if (t === "dm") {
      if (!otherUserId) return res.status(400).json({ message: "otherUserId required" });

      const other = await User.findById(otherUserId).select("_id name townSlug ward");
      if (!other) return res.status(404).json({ message: "Other user not found" });
      if ((other.townSlug || "") !== townSlug) {
        return res.status(403).json({ message: "DM allowed only within same town" });
      }

      // unique dmKey by sorted ids
      const ids = [String(req.user._id), String(other._id)].sort();
      const dmKey = ids.join("_");

      let room = await RChatRoom.findOne({ townSlug, type: "dm", dmKey });
      if (!room) {
        room = await RChatRoom.create({
          townSlug,
          type: "dm",
          dmKey,
          title: title || `Chat with ${other.name}`,
          members: [req.user._id, other._id],
        });
      } else {
        // ensure membership
        const members = (room.members || []).map(String);
        if (!members.includes(String(req.user._id))) room.members.push(req.user._id);
        if (!members.includes(String(other._id))) room.members.push(other._id);
        await room.save();
      }

      return res.json(room);
    }
  } catch (e) {
    res.status(500).json({ message: "Create room failed", error: e.message });
  }
};

/* =========================
   GET MESSAGES (room)
========================= */
exports.getMessages = async (req, res) => {
  try {
    const { townSlug } = scope(req);
    const room = await RChatRoom.findOne({ _id: req.params.roomId, townSlug });
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!(room.members || []).some((m) => sameId(m, req.user._id))) {
      return res.status(403).json({ message: "Not a room member" });
    }

    const messages = await RMessage.find({
      townSlug,
      roomId: room._id,
      deletedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    res.json({ room, messages });
  } catch (e) {
    res.status(500).json({ message: "Get messages failed", error: e.message });
  }
};

/* =========================
   SEND MESSAGE
========================= */
exports.sendMessage = async (req, res) => {
  try {
    const { townSlug } = scope(req);
    const { roomId, text } = req.body;

    if (!roomId) return res.status(400).json({ message: "roomId required" });
    if (!text || !String(text).trim()) return res.status(400).json({ message: "text required" });

    const room = await RChatRoom.findOne({ _id: roomId, townSlug });
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!(room.members || []).some((m) => sameId(m, req.user._id))) {
      return res.status(403).json({ message: "Not a room member" });
    }

    const msg = await RMessage.create({
      townSlug,
      roomId: room._id,
      senderId: req.user._id,
      senderName: req.user.name,
      text: String(text).trim(),
      deletedFor: [],
    });

    room.updatedAt = new Date();
    await room.save();

    res.status(201).json(msg);
  } catch (e) {
    res.status(500).json({ message: "Send message failed", error: e.message });
  }
};

/* =========================
   DELETE MESSAGE (for me)
   soft delete
========================= */
exports.deleteForMe = async (req, res) => {
  try {
    const { townSlug } = scope(req);

    const msg = await RMessage.findOne({ _id: req.params.id, townSlug });
    if (!msg) return res.status(404).json({ message: "Message not found" });

    // only member of that room can delete for themselves
    const room = await RChatRoom.findOne({ _id: msg.roomId, townSlug });
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!(room.members || []).some((m) => sameId(m, req.user._id))) {
      return res.status(403).json({ message: "Not allowed" });
    }

    msg.deletedFor = msg.deletedFor || [];
    if (!msg.deletedFor.some((u) => sameId(u, req.user._id))) {
      msg.deletedFor.push(req.user._id);
      await msg.save();
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Delete message failed", error: e.message });
  }
};
