// back/Controllers/ResidentDirectoryController.js
const RDirectoryEntry = require("../Models/RDirectoryEntry");
const slugify = require("slugify");

/**
 * Admin adds directory entries (plumber, hospital, etc.)
 * Resident chatbot fetches from here
 */

function getTownSlug(user) {
  if (user.townSlug) return user.townSlug;
  return slugify(user.townName || "", { lower: true, strict: true });
}

/**
 * GET /resident/directory
 */
exports.listDirectory = async (req, res) => {
  const townSlug = getTownSlug(req.user);
  const items = await RDirectoryEntry.find({ townSlug }).lean();
  res.json(items);
};

/**
 * POST /resident/chatbot
 * body: { query }
 * Simple rule-based answer
 */
exports.chatbot = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ message: "query required" });

  const townSlug = getTownSlug(req.user);
  const q = query.toLowerCase();

  if (q.includes("time")) {
    return res.json({ reply: new Date().toLocaleString() });
  }

  const entry = await RDirectoryEntry.findOne({
    townSlug,
    keywords: { $in: [q] },
  }).lean();

  if (!entry) {
    return res.json({ reply: "No information available" });
  }

  res.json({
    reply: `${entry.name} - ${entry.phone}${entry.notes ? " (" + entry.notes + ")" : ""}`,
  });
};
