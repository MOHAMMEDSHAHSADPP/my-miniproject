// back/Controllers/ResidentTicketController.js
const RTicket = require("../Models/RTicket");
const RComplaint = require("../Models/RComplaint");
const { notifyUser } = require("../utils/notify");

function townSlugFromUser(user) {
  return String(user?.townSlug || user?.townName || "").trim().toLowerCase();
}

function filePath(file) {
  return file ? `/uploads/resident/${file.filename}` : "";
}

// ========== TICKETS ==========
exports.listMyTickets = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const items = await RTicket.find({ townSlug, user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(items);
};

exports.createTicket = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);
    const { subject, message, description } = req.body;

    // Support both 'message' and 'description' from frontend
    const desc = message || description || "";
    if (!subject || !desc) return res.status(400).json({ message: "Subject and message required" });

    const ticket = await RTicket.create({
      townSlug,
      ward: req.user.ward || "",
      user: req.user._id, // Model uses 'user'
      subject,
      description: desc,
      status: "open",
      messages: [{ sender: "user", message: desc, createdAt: new Date() }]
    });

    await notifyUser(req.user._id, {
      title: "Ticket created",
      message: "Your ticket has been submitted.",
      type: "info",
      priority: "normal",
    });

    res.status(201).json(ticket);
  } catch (e) {
    res.status(500).json({ message: "Create ticket failed", error: e.message });
  }
};

exports.readTicket = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const ticket = await RTicket.findOne({ _id: req.params.id, townSlug, user: req.user._id }).populate("user", "name").lean();
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  res.json(ticket);
};

exports.replyToTicket = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "Message required" });

    const ticket = await RTicket.findOne({ _id: req.params.id, townSlug, user: req.user._id });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.messages = ticket.messages || [];
    ticket.messages.push({ sender: "user", message, createdAt: new Date() });

    if (ticket.status === "closed") ticket.status = "open";

    await ticket.save();
    res.json(ticket);
  } catch (e) {
    res.status(500).json({ message: "Reply failed", error: e.message });
  }
};

exports.closeTicket = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const ticket = await RTicket.findOne({ _id: req.params.id, townSlug, user: req.user._id });
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  ticket.status = "closed";
  await ticket.save();
  res.json({ ok: true });
};

// ========== COMPLAINTS ==========
exports.listMyComplaints = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const items = await RComplaint.find({ townSlug, userId: req.user._id, type: "complaint" })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(items);
};

exports.createComplaint = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);
    const complaintType = String(req.body.complaintType || "general").trim();
    const message = String(req.body.message || "").trim();
    if (!message) return res.status(400).json({ message: "message required" });

    const item = await RComplaint.create({
      townSlug,
      ward: req.user.ward || "",
      userId: req.user._id,
      type: "complaint",
      complaintType,
      message,
      image: filePath(req.file),
      status: "open",
      adminNote: "",
    });

    await notifyUser(req.user._id, {
      title: "Complaint submitted",
      message: "Your complaint has been submitted.",
      type: "info",
      priority: "normal",
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Create complaint failed", error: e.message });
  }
};