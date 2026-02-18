const router = require("express").Router();
const path = require("path");
const multer = require("multer");
const slugify = require("slugify");

const authMiddleware = require("../Middlewares/authMiddleware");
const requireRole = require("../Middlewares/requireRole");
const requireTownScope = require("../Middlewares/requireTownScope");

const Admin = require("../Controllers/VisitorAdminController");

console.log("✅ LOADED: Routes/VisitorAdminRoutes.js");

// ===== MULTER (uploads/visitor) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/visitor"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ===== SAFE HANDLER CHECK (prevents "argument handler must be a function") =====
function must(fn, name) {
  if (typeof fn !== "function") {
    throw new Error(`Route handler missing or not a function: ${name}`);
  }
  return fn;
}

// ✅ Protect all visitor admin routes
router.use(authMiddleware, requireRole(["super_admin", "admin", "town_admin"]));

// =====================
// ✅ TOWNS
// =====================
router.get("/towns", must(Admin.listTowns, "Admin.listTowns"));

router.post(
  "/towns",
  requireRole(["super_admin"]),
  upload.single("heroImage"),
  (req, _res, next) => {
    if (!req.body.townSlug && req.body.townName) {
      req.body.townSlug = slugify(req.body.townName, {
        lower: true,
        strict: true,
      });
    }
    next();
  },
  must(Admin.createTown, "Admin.createTown")
);

router.patch(
  "/towns/:id",
  upload.single("heroImage"),
  must(Admin.updateTown, "Admin.updateTown")
);

router.delete(
  "/towns/:id",
  requireRole(["super_admin"]),
  must(Admin.deleteTown, "Admin.deleteTown")
);

// =====================
// ✅ TRENDING
// =====================
router.get(
  "/:townSlug/trending",
  requireTownScope,
  must(Admin.listTrending, "Admin.listTrending")
);

router.post(
  "/:townSlug/trending",
  requireTownScope,
  upload.single("image"),
  must(Admin.addTrending, "Admin.addTrending")
);

router.delete(
  "/trending/:id",
  must(Admin.deleteTrending, "Admin.deleteTrending")
);

// =====================
// ✅ PLACES
// =====================
router.get(
  "/:townSlug/places",
  requireTownScope,
  must(Admin.listPlaces, "Admin.listPlaces")
);

router.post(
  "/:townSlug/places",
  requireTownScope,
  upload.array("images", 6),
  must(Admin.addPlace, "Admin.addPlace")
);

router.delete(
  "/places/:id",
  must(Admin.deletePlace, "Admin.deletePlace")
);

// =====================
// ✅ ANNOUNCEMENTS
// =====================
router.get(
  "/:townSlug/announcements",
  requireTownScope,
  must(Admin.listAnnouncements, "Admin.listAnnouncements")
);

router.post(
  "/:townSlug/announcements",
  requireTownScope,
  must(Admin.addAnnouncement, "Admin.addAnnouncement")
);

router.delete(
  "/announcements/:id",
  must(Admin.deleteAnnouncement, "Admin.deleteAnnouncement")
);

// =====================
// ✅ EMERGENCY
// =====================
router.get(
  "/:townSlug/emergency",
  requireTownScope,
  must(Admin.listEmergency, "Admin.listEmergency")
);

router.post(
  "/:townSlug/emergency",
  requireTownScope,
  must(Admin.addEmergency, "Admin.addEmergency")
);

router.delete(
  "/emergency/:id",
  must(Admin.deleteEmergency, "Admin.deleteEmergency")
);

// =====================
// ✅ TRAVEL
// =====================
router.get(
  "/:townSlug/travel",
  requireTownScope,
  must(Admin.listTravel, "Admin.listTravel")
);

router.post(
  "/:townSlug/travel",
  requireTownScope,
  must(Admin.addTravel, "Admin.addTravel")
);

router.delete(
  "/travel/:id",
  must(Admin.deleteTravel, "Admin.deleteTravel")
);

// =====================
// ✅ COMPLAINTS
// =====================
router.get(
  "/:townSlug/complaints",
  requireTownScope,
  must(Admin.listComplaints, "Admin.listComplaints")
);

router.patch(
  "/complaints/:id/resolve",
  must(Admin.resolveComplaint, "Admin.resolveComplaint")
);

module.exports = router;