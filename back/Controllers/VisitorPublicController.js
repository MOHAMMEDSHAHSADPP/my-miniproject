const Town = require("../Models/Town");
const Place = require("../Models/Place");
const Trending = require("../Models/Trending");
const Announcement = require("../Models/Announcement");
const Emergency = require("../Models/Emergency");
const Travel = require("../Models/Travel");
const Complaint = require("../Models/Complaint");
const ViewLog = require("../Models/Viewlog");
const WarningPlace = require("../Models/WarningPlace");
const TownInfo = require("../Models/TownInfo");
const MapBuilding = require("../Models/MapBuilding");
const Service = require("../Models/Service");

// IST date/time
function getISTNow() {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full" }).format(now);
  const time = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", timeStyle: "medium" }).format(now);
  return { date, time };
}

// directory for dropdown
exports.getTownDirectory = async (req, res) => {
  const towns = await Town.find({ isActive: true }).sort({ district: 1, townName: 1 }).lean();
  const districts = {};
  towns.forEach((t) => {
    if (!districts[t.district]) districts[t.district] = [];
    districts[t.district].push({ townName: t.townName, townSlug: t.townSlug });
  });
  res.json({ districts });
};

// town landing minimal
exports.getTownHome = async (req, res) => {
  const town = await Town.findOne({ townSlug: req.params.townSlug, isActive: true }).lean();
  if (!town) return res.status(404).json({ message: "Town not found" });

  const [trending, announcements, emergency, popularPlaces, recentPlaces, warningPlaces] = await Promise.all([
    // Trending banners
    Trending.find({ townSlug: town.townSlug, isActive: true }).sort({ createdAt: -1 }).lean(),

    // Announcements (limit 5)
    Announcement.find({ townSlug: town.townSlug, isActive: true }).sort({ createdAt: -1 }).limit(5).lean(),

    // Emergency
    Emergency.find({ townSlug: town.townSlug, isActive: true }).sort({ createdAt: -1 }).lean(),

    // Popular places (by views)
    Place.find({ townSlug: town.townSlug, isActive: true }).sort({ viewsCount: -1, likesCount: -1 }).limit(8).lean(),

    // Recent places
    Place.find({ townSlug: town.townSlug, isActive: true }).sort({ createdAt: -1 }).limit(8).lean(),

    // Warning Places (NEW)
    WarningPlace.find({ townSlug: town.townSlug, isActive: true }).sort({ createdAt: -1 }).lean(),
  ]);

  res.json({
    town,
    trending,
    announcements,
    emergency,
    popularPlaces,
    recentPlaces,
    warningPlaces,
  });
};

exports.getTrending = async (req, res) => {
  const items = await Trending.find({ townSlug: req.params.townSlug, isActive: true }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.getAnnouncements = async (req, res) => {
  const items = await Announcement.find({ townSlug: req.params.townSlug, isActive: true }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.getEmergency = async (req, res) => {
  const items = await Emergency.find({ townSlug: req.params.townSlug, isActive: true }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.getTravel = async (req, res) => {
  const items = await Travel.find({ townSlug: req.params.townSlug, isActive: true }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

// PLP + search + sorting
exports.listPlaces = async (req, res) => {
  const { q = "", category = "", sort = "popular" } = req.query;

  const filter = { townSlug: req.params.townSlug, isActive: true };
  if (category) filter.category = category;

  if (q) {
    filter.$or = [
      { title: new RegExp(q, "i") },
      { description: new RegExp(q, "i") },
      { tags: { $in: [new RegExp(q, "i")] } },
      { category: new RegExp(q, "i") },
    ];
  }

  const sortMap = {
    popular: { viewsCount: -1, likesCount: -1 },
    recent: { updatedAt: -1 },
    new: { createdAt: -1 },
  };

  const items = await Place.find(filter).sort(sortMap[sort] || sortMap.popular).limit(60).lean();
  res.json(items);
};

// PDP
exports.getPlaceDetail = async (req, res) => {
  const item = await Place.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ message: "Not found" });
  res.json(item);
};

exports.addView = async (req, res) => {
  const item = await Place.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  item.viewsCount += 1;
  await item.save();

  await ViewLog.create({
    townSlug: item.townSlug,
    placeId: item._id,
    userId: req.body.userId || null,
  });

  res.json({ ok: true, viewsCount: item.viewsCount });
};

exports.addLike = async (req, res) => {
  const item = await Place.findById(req.params.id);
  if (!item) return res.status(404).json({ message: "Not found" });

  item.likesCount += 1;
  await item.save();

  res.json({ ok: true, likesCount: item.likesCount });
};

exports.createComplaint = async (req, res) => {
  const town = await Town.findOne({ townSlug: req.params.townSlug, isActive: true }).lean();
  if (!town) return res.status(404).json({ message: "Town not found" });

  const { message, type, fromName, fromEmail, fromPhone } = req.body;
  if (!message) return res.status(400).json({ message: "message required" });

  const c = await Complaint.create({
    townSlug: town.townSlug,
    townName: town.townName,
    message,
    type: type || "complaint",
    fromName: fromName || "",
    fromEmail: fromEmail || "",
    fromPhone: fromPhone || "",
    status: "open",
  });

  res.status(201).json({ message: "Complaint submitted", complaint: c });
};

// chatbot (non-AI + Admin Info)
exports.chat = async (req, res) => {
  const townSlug = req.params.townSlug;
  const textRaw = (req.body.message || "").toString().trim();
  const text = textRaw.toLowerCase();
  if (!textRaw) return res.status(400).json({ reply: "Type something." });

  // 1. Check Admin-added Info (Exact Keyword Match in Sentence)
  const infos = await TownInfo.find({ townSlug, isActive: true }).lean();
  // Sort by keyword length desc to match longest phrases first (e.g. "bus timing" before "bus")
  infos.sort((a, b) => b.keyword.length - a.keyword.length);

  const match = infos.find(i => text.includes(i.keyword));
  if (match) return res.json({ reply: match.content });

  // 2. Standard Hardcoded Logic
  if (text.includes("time")) return res.json({ reply: `Time (IST): ${getISTNow().time}` });
  if (text.includes("date") || text.includes("today")) return res.json({ reply: `Today: ${getISTNow().date}` });

  if (text.includes("announcement") || text.includes("program") || text.includes("event")) {
    const items = await Announcement.find({ townSlug, isActive: true }).sort({ createdAt: -1 }).limit(3).lean();
    if (!items.length) return res.json({ reply: "No announcements now." });
    return res.json({ reply: items.map((a) => `• ${a.title}`).join("\n") });
  }

  if (text.includes("emergency") || text.includes("police") || text.includes("ambulance") || text.includes("fire")) {
    const nums = await Emergency.find({ townSlug, isActive: true }).sort({ createdAt: -1 }).limit(6).lean();
    if (!nums.length) return res.json({ reply: "No emergency numbers added yet." });
    return res.json({ reply: nums.map((n) => `• ${n.label}: ${n.number}`).join("\n") });
  }

  // category mapping
  const map = [
    { key: "hotel", cat: "hotel" },
    { key: "hospital", cat: "hospital" },
    { key: "shop", cat: "shop" },
    { key: "restaurant", cat: "restaurant" },
    { key: "tourist", cat: "tourist_spot" },
    { key: "barber", cat: "barber" },
  ];
  const found = map.find((m) => text.includes(m.key));
  if (found) {
    const items = await Place.find({ townSlug, category: found.cat, isActive: true })
      .sort({ viewsCount: -1, likesCount: -1 })
      .limit(5)
      .lean();
    if (!items.length) return res.json({ reply: `No ${found.key} added yet.` });
    return res.json({ reply: items.map((p) => `• ${p.title}${p.phone ? " — " + p.phone : ""}`).join("\n") });
  }

  // fallback search
  const items = await Place.find({
    townSlug,
    isActive: true,
    $or: [{ title: new RegExp(textRaw, "i") }, { description: new RegExp(textRaw, "i") }],
  })
    .sort({ viewsCount: -1 })
    .limit(5)
    .lean();

  if (items.length) return res.json({ reply: items.map((p) => `• ${p.title} (${p.category})`).join("\n") });

  return res.json({ reply: "Try: hotel, hospital, emergency, announcements, tourist, time, date." });
};

exports.getWarningPlaces = async (req, res) => {
  const items = await WarningPlace.find({ townSlug: req.params.townSlug, isActive: true }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.getMapBuildings = async (req, res) => {
  try {
    const items = await MapBuilding.find({
      townSlug: req.params.townSlug,
      active: true
    }).sort({ customName: 1 }).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch map buildings", error: e.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const items = await Service.find({
      townSlug: req.params.townSlug,
      isActive: true
    }).sort({ category: 1, name: 1 }).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Failed to fetch services", error: e.message });
  }
};

