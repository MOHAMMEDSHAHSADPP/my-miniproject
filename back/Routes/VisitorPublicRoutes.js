const router = require("express").Router();
const Public = require("../Controllers/VisitorPublicController");
const TownController = require("../Controllers/TownController");
const MapController = require("../Controllers/MapController");

// directory
router.get("/towns", Public.getTownDirectory);

// town landing (light bundle)
router.get("/:townSlug/home", Public.getTownHome);

// separate pages
router.get("/:townSlug/trending", Public.getTrending);
router.get("/:townSlug/announcements", Public.getAnnouncements);
router.get("/:townSlug/emergency", Public.getEmergency);
router.get("/:townSlug/travel", Public.getTravel);

// PLP + search
router.get("/:townSlug/places", Public.listPlaces);

// PDP
router.get("/places/:id", Public.getPlaceDetail);

// metrics
router.post("/places/:id/view", Public.addView);
router.post("/places/:id/like", Public.addLike);

// complaint box
router.post("/:townSlug/complaints", Public.createComplaint);

// chatbot
router.post("/:townSlug/chat", Public.chat);

// warnings
router.get("/:townSlug/warnings", Public.getWarningPlaces);
router.get("/:townSlug/map-buildings", Public.getMapBuildings);
router.get("/:townSlug/services", Public.getServices);

// =============================================================================
// TOWN & MAP DATA (NEW)
// =============================================================================
// List active towns
router.get("/towns-list", TownController.getActiveTowns);

// Get town config by slug
router.get("/towns/:slug", TownController.getTownBySlug);

// Get OSM data (buildings, roads, water, parks) - CACHED
// Map configuration (for Mapbox initialization)
router.get("/map/config", MapController.getTownConfig);


module.exports = router;
