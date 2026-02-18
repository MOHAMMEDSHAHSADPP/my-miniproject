// back/Controllers/VisitorAdminController.js
const Town = require("../Models/Town");
const Place = require("../Models/Place");
const Trending = require("../Models/Trending");
const Announcement = require("../Models/Announcement");
const Emergency = require("../Models/Emergency");
const Travel = require("../Models/Travel");
const Complaint = require("../Models/Complaint");
const WarningPlace = require("../Models/WarningPlace");
const TownInfo = require("../Models/TownInfo");
const MapBuilding = require("../Models/MapBuilding");
const Service = require("../Models/Service");

const AuditLog = require("../Models/AuditLog");
const audit = require("../utils/audit");

const filePath = (file) => (file ? `/uploads/visitor/${file.filename}` : "");

// ✅ category-specific keys (admin form will follow this)
const DETAILS_SCHEMA = {
  hospital: ["timing", "departments", "doctors", "ambulanceNumber", "emergencyAvailable"],
  hotel: ["checkIn", "checkOut", "priceRange", "facilities", "menuUrl"],
  restaurant: ["timing", "priceRange", "specialItems", "menuUrl"],
  shop: ["openingHours", "services", "paymentMethods"],
  barber: ["timing", "services", "priceList"],
  tourist_spot: ["timing", "entryFee", "bestTime", "tips"],
  cultural_spot: ["timing", "history", "rules"],
  danger_spot: ["warning", "safeTiming", "emergencyTips"],
  bank: ["timings", "ifscCode", "branchName", "atmAvailable", "services"],
};

function sanitizeDetails(category, detailsObj) {
  const allowed = DETAILS_SCHEMA[category] || [];
  const out = {};
  allowed.forEach((k) => {
    if (detailsObj && detailsObj[k] !== undefined) out[k] = detailsObj[k];
  });
  return out;
}

/**
 * ✅ Option B scope check
 * - super_admin: all
 * - others: only req.user.townSlug
 */
function isSuperAdmin(req) {
  return req.user?.role === "super_admin";
}
function ensureTownScope(req, townSlug) {
  if (isSuperAdmin(req)) return true;
  const myTown = (req.user?.townSlug || "").toString();
  return myTown && myTown === String(townSlug || "");
}

/* =========================
   ✅ TOWNS
========================= */

exports.listTowns = async (req, res) => {
  try {
    const towns = await Town.find().sort({ district: 1, townName: 1 }).lean();
    res.json(towns);
  } catch (e) {
    res.status(500).json({ message: "Failed to list towns", error: e.message });
  }
};

// super_admin route-level protected already, but still safe-check ok.
exports.createTown = async (req, res) => {
  try {
    const { state, district, townName, townSlug, about, highlights } = req.body;
    if (!district || !townName || !townSlug) {
      return res.status(400).json({ message: "district, townName, townSlug required" });
    }

    const heroImage = filePath(req.file);
    const hi = highlights
      ? String(highlights).split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const town = await Town.create({
      state: state || "Kerala",
      district,
      townName,
      townSlug,
      about: about || "",
      heroImage,
      highlights: hi,
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_towns",
      action: "create",
      townSlug: town.townSlug,
      entityType: "Town",
      entityId: town._id,
      message: `Created town ${town.townName} (${town.townSlug})`,
    });

    res.status(201).json(town);
  } catch (e) {
    res.status(500).json({ message: "Create town failed", error: e.message });
  }
};

// ✅ super_admin: update any
// ✅ town_admin: only their own town (by townSlug check)
exports.updateTown = async (req, res) => {
  try {
    const town = await Town.findById(req.params.id);
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { state, district, townName, townSlug, about, highlights, isActive } = req.body;

    if (state !== undefined) town.state = state;
    if (district !== undefined) town.district = district;
    if (townName !== undefined) town.townName = townName;

    // ⚠️ If you change townSlug, it affects ALL data. Allow only super_admin.
    if (townSlug !== undefined) {
      if (!isSuperAdmin(req)) {
        return res.status(403).json({ message: "Only super_admin can change townSlug" });
      }
      town.townSlug = townSlug;
    }

    if (about !== undefined) town.about = about;
    if (isActive !== undefined) town.isActive = isActive === "true" || isActive === true;

    if (highlights !== undefined) {
      town.highlights = String(highlights).split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (req.file) town.heroImage = filePath(req.file);

    await town.save();

    await audit({
      actor: req.user,
      module: "visitor_towns",
      action: "update",
      townSlug: town.townSlug,
      entityType: "Town",
      entityId: town._id,
      message: `Updated town ${town.townName} (${town.townSlug})`,
    });

    res.json(town);
  } catch (e) {
    res.status(500).json({ message: "Update town failed", error: e.message });
  }
};

// super_admin route-level protected already
exports.deleteTown = async (req, res) => {
  try {
    const town = await Town.findByIdAndDelete(req.params.id);
    if (!town) return res.status(404).json({ message: "Town not found" });

    await Promise.all([
      Place.deleteMany({ townSlug: town.townSlug }),
      Trending.deleteMany({ townSlug: town.townSlug }),
      Announcement.deleteMany({ townSlug: town.townSlug }),
      Emergency.deleteMany({ townSlug: town.townSlug }),
      Travel.deleteMany({ townSlug: town.townSlug }),
      Complaint.deleteMany({ townSlug: town.townSlug }),
    ]);

    await audit({
      actor: req.user,
      module: "visitor_towns",
      action: "delete",
      townSlug: town.townSlug,
      entityType: "Town",
      entityId: town._id,
      message: `Deleted town ${town.townName} (${town.townSlug})`,
    });

    res.json({ message: "Town deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete town failed", error: e.message });
  }
};

/* =========================
   ✅ TRENDING (Banner)
========================= */

exports.listTrending = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }
  const items = await Trending.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.addTrending = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { title, subtitle } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });

    const image = filePath(req.file);
    const item = await Trending.create({
      townSlug: town.townSlug,
      townName: town.townName,
      title,
      subtitle: subtitle || "",
      image,
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_trending",
      action: "create",
      townSlug: town.townSlug,
      entityType: "Trending",
      entityId: item._id,
      message: `Added trending banner: ${title}`,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Add trending failed", error: e.message });
  }
};

exports.deleteTrending = async (req, res) => {
  try {
    const item = await Trending.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await Trending.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_trending",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "Trending",
      entityId: item._id,
      message: `Deleted trending banner: ${item.title}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete trending failed", error: e.message });
  }
};

/* =========================
   ✅ PLACES
========================= */

exports.listPlaces = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }

  const { q = "", category = "" } = req.query;
  const filter = { townSlug: req.params.townSlug };
  if (category) filter.category = category;
  if (q) {
    filter.$or = [{ title: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
  }

  const items = await Place.find(filter).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.addPlace = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { category, title, description, address, phone, tags, mapUrl, lat, lng, details } = req.body;
    if (!category || !title) return res.status(400).json({ message: "category and title required" });

    const images = (req.files || []).map((f) => `/uploads/visitor/${f.filename}`);
    const parsedTags = tags ? String(tags).split(",").map((s) => s.trim()).filter(Boolean) : [];

    let detailsObj = {};
    if (details) {
      try { detailsObj = JSON.parse(details); } catch { }
    }
    const cleaned = sanitizeDetails(category, detailsObj);

    const place = await Place.create({
      townSlug: town.townSlug,
      townName: town.townName,
      category,
      title,
      description: description || "",
      address: address || "",
      phone: phone || "",
      tags: parsedTags,
      mapUrl: mapUrl || "",
      location: { lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null },
      images,
      details: cleaned,
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_places",
      action: "create",
      townSlug: town.townSlug,
      entityType: "Place",
      entityId: place._id,
      message: `Added place: ${title} (${category})`,
    });

    res.status(201).json(place);
  } catch (e) {
    res.status(500).json({ message: "Add place failed", error: e.message });
  }
};

exports.deletePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, place.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await Place.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_places",
      action: "delete",
      townSlug: place.townSlug,
      entityType: "Place",
      entityId: place._id,
      message: `Deleted place: ${place.title}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete place failed", error: e.message });
  }
};

/* =========================
   ✅ ANNOUNCEMENTS
========================= */

exports.listAnnouncements = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }
  const items = await Announcement.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.addAnnouncement = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { title, description, startDate, endDate, priority } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });

    const item = await Announcement.create({
      townSlug: town.townSlug,
      townName: town.townName,
      title,
      description: description || "",
      startDate: startDate || "",
      endDate: endDate || "",
      priority: priority || "normal",
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_announcements",
      action: "create",
      townSlug: town.townSlug,
      entityType: "Announcement",
      entityId: item._id,
      message: `Added announcement: ${title}`,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Add announcement failed", error: e.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_announcements",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "Announcement",
      entityId: item._id,
      message: `Deleted announcement: ${item.title}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete announcement failed", error: e.message });
  }
};

/* =========================
   ✅ EMERGENCY
========================= */

exports.listEmergency = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }
  const items = await Emergency.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.addEmergency = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { label, number, notes } = req.body;
    if (!label || !number) return res.status(400).json({ message: "label and number required" });

    const item = await Emergency.create({
      townSlug: town.townSlug,
      townName: town.townName,
      label,
      number,
      notes: notes || "",
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_emergency",
      action: "create",
      townSlug: town.townSlug,
      entityType: "Emergency",
      entityId: item._id,
      message: `Added emergency contact: ${label}`,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Add emergency failed", error: e.message });
  }
};

exports.deleteEmergency = async (req, res) => {
  try {
    const item = await Emergency.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await Emergency.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_emergency",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "Emergency",
      entityId: item._id,
      message: `Deleted emergency contact: ${item.label}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete emergency failed", error: e.message });
  }
};

/* =========================
   ✅ TRAVEL
========================= */

exports.listTravel = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }
  const items = await Travel.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.addTravel = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { type, title, details, mapUrl } = req.body;
    if (!title) return res.status(400).json({ message: "title required" });

    const item = await Travel.create({
      townSlug: town.townSlug,
      townName: town.townName,
      type: type || "other",
      title,
      details: details || "",
      mapUrl: mapUrl || "",
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_travel",
      action: "create",
      townSlug: town.townSlug,
      entityType: "Travel",
      entityId: item._id,
      message: `Added travel info: ${title}`,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Add travel failed", error: e.message });
  }
};

exports.deleteTravel = async (req, res) => {
  try {
    const item = await Travel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await Travel.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_travel",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "Travel",
      entityId: item._id,
      message: `Deleted travel info: ${item.title}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete travel failed", error: e.message });
  }
};

/* =========================
   ✅ VISITOR COMPLAINTS
========================= */

exports.listComplaints = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }
  const items = await Complaint.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.resolveComplaint = async (req, res) => {
  try {
    const item = await Complaint.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    item.status = "resolved";
    if (req.body.adminNote !== undefined) item.adminNote = req.body.adminNote;
    await item.save();

    await audit({
      actor: req.user,
      module: "visitor_complaints",
      action: "resolve",
      townSlug: item.townSlug,
      entityType: "Complaint",
      entityId: item._id,
      message: `Resolved visitor complaint`,
    });

    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Resolve complaint failed", error: e.message });
  }
};

/* =========================
   ✅ WARNING PLACES
========================= */

exports.listWarningPlaces = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }
  const items = await WarningPlace.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.addWarningPlace = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { title, description } = req.body;
    if (!title || !description) return res.status(400).json({ message: "title and description required" });

    const image = filePath(req.file);
    if (!image) return res.status(400).json({ message: "image required" });

    const item = await WarningPlace.create({
      townSlug: town.townSlug,
      townName: town.townName,
      title,
      description,
      image,
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_warnings",
      action: "create",
      townSlug: town.townSlug,
      entityType: "WarningPlace",
      entityId: item._id,
      message: `Added warning place: ${title}`,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Add warning place failed", error: e.message });
  }
};

exports.deleteWarningPlace = async (req, res) => {
  try {
    const item = await WarningPlace.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await WarningPlace.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_warnings",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "WarningPlace",
      entityId: item._id,
      message: `Deleted warning place: ${item.title}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete warning place failed", error: e.message });
  }
};

/* =========================
   ✅ TOWN INFO (CHATBOT)
========================= */

exports.listTownInfo = async (req, res) => {
  if (!ensureTownScope(req, req.params.townSlug)) {
    return res.status(403).json({ message: "Not allowed for this town" });
  }
  const items = await TownInfo.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 }).lean();
  res.json(items);
};

exports.addTownInfo = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { keyword, content, category } = req.body;
    if (!keyword || !content) return res.status(400).json({ message: "keyword and content required" });

    const item = await TownInfo.create({
      townSlug: town.townSlug,
      keyword: keyword.toLowerCase(),
      content,
      category: category || "general",
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_info",
      action: "create",
      townSlug: town.townSlug,
      entityType: "TownInfo",
      entityId: item._id,
      message: `Added chatbot info for: ${keyword}`,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Add info failed", error: e.message });
  }
};

exports.deleteTownInfo = async (req, res) => {
  try {
    const item = await TownInfo.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await TownInfo.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_info",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "TownInfo",
      entityId: item._id,
      message: `Deleted chatbot info: ${item.keyword}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete info failed", error: e.message });
  }
};

// ========== MAP BUILDINGS (3D Map) ==========

// List all map buildings for admin
exports.listMapBuildings = async (req, res) => {
  try {
    const townSlug = ensureTownScope(req);
    const items = await MapBuilding.find({ townSlug }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "List map buildings failed", error: e.message });
  }
};

/* =========================
   ✅ SERVICES (New Page)
========================= */

exports.listServices = async (req, res) => {
  console.log(`[VisitorAdmin] listServices called for ${req.params.townSlug} by ${req.user?.email}`);
  try {
    // Validating town scope
    if (!ensureTownScope(req, req.params.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }



    const items = await Service.find({ townSlug: req.params.townSlug }).sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "List services failed", error: e.message });
  }
};

exports.addService = async (req, res) => {
  try {
    const town = await Town.findOne({ townSlug: req.params.townSlug }).lean();
    if (!town) return res.status(404).json({ message: "Town not found" });

    if (!ensureTownScope(req, town.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    const { name, category, link, contact, description } = req.body;
    if (!name || !category) return res.status(400).json({ message: "Name and Category required" });

    const icon = filePath(req.file);
    if (!icon) return res.status(400).json({ message: "Icon image required" });

    const item = await Service.create({
      townSlug: town.townSlug,
      townName: town.townName,
      category,
      name,
      icon,
      link: link || "",
      contact: contact || "",
      description: description || "",
      isActive: true,
    });

    await audit({
      actor: req.user,
      module: "visitor_services",
      action: "create",
      townSlug: town.townSlug,
      entityType: "Service",
      entityId: item._id,
      message: `Added service: ${name} (${category})`,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Add service failed", error: e.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const item = await Service.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await Service.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_services",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "Service",
      entityId: item._id,
      message: `Deleted service: ${item.name}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete service failed", error: e.message });
  }
};

// Add or update map building
exports.addMapBuilding = async (req, res) => {
  try {
    const townSlug = ensureTownScope(req);
    const { osmId, customName, type, description, active, centroid, osmData } = req.body;

    if (!osmId || !centroid || !centroid.lat || !centroid.lng) {
      return res.status(400).json({ message: "osmId and centroid (lat, lng) are required" });
    }

    const image = req.file ? filePath(req.file) : "";

    // Upsert: update if exists, create if not
    const item = await MapBuilding.findOneAndUpdate(
      { townSlug, osmId },
      {
        customName: customName || "",
        type: type || "other",
        image: image || undefined, // only update if new image uploaded
        description: description || "",
        active: active !== undefined ? active : true,
        centroid,
        osmData: osmData || {}
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await audit({
      actor: req.user,
      module: "visitor_map",
      action: item.isNew ? "create" : "update",
      townSlug,
      entityType: "MapBuilding",
      entityId: item._id,
      message: `${item.isNew ? "Added" : "Updated"} map building: ${customName || osmId}`,
    });

    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Add/update map building failed", error: e.message });
  }
};

// Delete map building
exports.deleteMapBuilding = async (req, res) => {
  try {
    const item = await MapBuilding.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    if (!ensureTownScope(req, item.townSlug)) {
      return res.status(403).json({ message: "Not allowed for this town" });
    }

    await MapBuilding.findByIdAndDelete(req.params.id);

    await audit({
      actor: req.user,
      module: "visitor_map",
      action: "delete",
      townSlug: item.townSlug,
      entityType: "MapBuilding",
      entityId: item._id,
      message: `Deleted map building: ${item.customName || item.osmId}`,
    });

    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete map building failed", error: e.message });
  }
};

