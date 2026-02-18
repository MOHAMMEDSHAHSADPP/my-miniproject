const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const slugify = require("slugify");

// Middleware
const adminAuth = require("../Middlewares/adminAuth"); // The new robust auth
const requireTownScope = require("../Middlewares/requireTownScope"); // Keep for visitor routes specifically

// Controllers
const ResidentAdmin = require("../Controllers/ResidentAdminController");
const ResidentAnalytics = require("../Controllers/ResidentAnalyticsController");
const VisitorAdmin = require("../Controllers/VisitorAdminController");
const TownController = require("../Controllers/TownController");
const MapController = require("../Controllers/MapController");

// =============================================================================
// MULTER SETUP (Two instances)
// =============================================================================

// 1. Resident Uploads
const resDir = path.join(__dirname, "..", "uploads", "resident");
if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
const uploadResident = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, resDir),
        filename: (req, _f, cb) => cb(null, Date.now() + path.extname(_f.originalname)),
    }),
});

// 2. Visitor Uploads
const visDir = path.join(__dirname, "..", "uploads", "visitor");
if (!fs.existsSync(visDir)) fs.mkdirSync(visDir, { recursive: true });
const uploadVisitor = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, visDir),
        filename: (req, _f, cb) => cb(null, Date.now() + path.extname(_f.originalname)),
    }),
});

// Guard helper
function must(fn, name) {
    if (typeof fn !== "function") throw new Error(`Handler missing: ${name}`);
    return fn;
}

// =============================================================================
// GLOBAL PROTECTION
// =============================================================================
router.use(adminAuth);

// =============================================================================
// RESIDENT ADMIN ROUTES (Mounted at /admin/...)
// =============================================================================

// Registry
router.get("/registry", must(ResidentAdmin.registryList, "Resident.registryList"));
router.post("/registry", must(ResidentAdmin.registryCreate, "Resident.registryCreate"));
router.patch("/registry/:id", must(ResidentAdmin.registryUpdate, "Resident.registryUpdate"));
router.delete("/registry/:id", must(ResidentAdmin.registryDelete, "Resident.registryDelete"));

// Users
router.get("/users", must(ResidentAdmin.usersList, "Resident.usersList"));
router.patch("/users/:id/ban", must(ResidentAdmin.banUser, "Resident.banUser"));
router.patch("/users/:id/unban", must(ResidentAdmin.unbanUser, "Resident.unbanUser"));

// Analytics
router.get("/analytics/summary", must(ResidentAnalytics.summary, "Analytics.summary"));
router.get("/analytics/complaints-by-ward", must(ResidentAnalytics.complaintsByWard, "Analytics.ward"));
router.get("/analytics/active-users", must(ResidentAnalytics.activeUsers, "Analytics.active"));
router.get("/analytics/market", must(ResidentAnalytics.marketStats, "Analytics.market"));
router.get("/analytics/services", must(ResidentAnalytics.serviceStats, "Analytics.services"));

// Notifications
router.post("/notify/town", must(ResidentAdmin.broadcastTownNotification, "Resident.notify"));

// Alerts / Notices
router.get("/alerts", must(ResidentAdmin.alertsAdminList, "Resident.alertsList"));
router.post("/alerts", must(ResidentAdmin.createAlert, "Resident.createAlert"));
router.patch("/alerts/:id", must(ResidentAdmin.updateAlert, "Resident.updateAlert"));
router.delete("/alerts/:id", must(ResidentAdmin.deleteAlert, "Resident.deleteAlert"));

router.get("/notices", must(ResidentAdmin.noticesAdminList, "Resident.noticesList"));
router.post("/notices", must(ResidentAdmin.createNotice, "Resident.createNotice"));
router.patch("/notices/:id", must(ResidentAdmin.updateNotice, "Resident.updateNotice"));
router.delete("/notices/:id", must(ResidentAdmin.deleteNotice, "Resident.deleteNotice"));
router.post("/notices/:id/remind", must(ResidentAdmin.remindUnacknowledgedNotice, "Resident.remindUnacknowledgedNotice"));

// Events
router.get("/events", must(ResidentAdmin.eventsAdminList, "Resident.eventsList"));
router.post("/events", uploadResident.single("image"), must(ResidentAdmin.createEvent, "Resident.createEvent"));
router.patch("/events/:id", uploadResident.single("image"), must(ResidentAdmin.updateEvent, "Resident.updateEvent"));
router.delete("/events/:id", must(ResidentAdmin.deleteEvent, "Resident.deleteEvent"));

// Polls
router.get("/polls", must(ResidentAdmin.pollsAdminList, "Resident.pollsList"));
router.post("/polls", must(ResidentAdmin.createPoll, "Resident.createPoll"));
router.patch("/polls/:id", must(ResidentAdmin.updatePoll, "Resident.updatePoll"));
router.delete("/polls/:id", must(ResidentAdmin.deletePoll, "Resident.deletePoll"));

// Suggestions (using CORRECTED route from our earlier fix)
router.get("/suggestions", must(ResidentAdmin.suggestionsList, "Resident.suggestionsList"));
router.patch("/suggestions/:id/status", must(ResidentAdmin.updateSuggestionStatus, "Resident.updateSuggestionStatus"));

// Complaints
router.get("/complaints", must(ResidentAdmin.complaintsList, "Resident.complaintsList"));
router.patch("/complaints/:id/status", must(ResidentAdmin.updateComplaintStatus, "Resident.updateComplaintStatus"));

// Tickets
router.get("/tickets", must(ResidentAdmin.ticketsList, "Resident.ticketsList"));
router.patch("/tickets/:id/status", must(ResidentAdmin.updateTicketStatus, "Resident.updateTicketStatus"));
router.post("/tickets/:id/reply", must(ResidentAdmin.replyTicket, "Resident.replyTicket"));

// Service Requests
router.get("/services/requests", must(ResidentAdmin.serviceRequestsList, "Resident.serviceRequestsList"));
router.patch("/services/requests/:id/status", must(ResidentAdmin.updateServiceRequestStatus, "Resident.updateServiceRequestStatus"));

// Documents
router.get("/documents", must(ResidentAdmin.documentsList, "Resident.documentsList"));
router.post("/documents/request", must(ResidentAdmin.requestDocument, "Resident.requestDocument"));
router.delete("/documents/:id", must(ResidentAdmin.deleteDocument, "Resident.deleteDocument"));

// Directory
router.get("/directory", must(ResidentAdmin.directoryList, "Resident.directoryList"));
router.post("/directory", must(ResidentAdmin.addDirectoryEntry, "Resident.addDirectoryEntry"));
router.patch("/directory/:id", must(ResidentAdmin.updateDirectoryEntry, "Resident.updateDirectoryEntry"));
router.delete("/directory/:id", must(ResidentAdmin.deleteDirectoryEntry, "Resident.deleteDirectoryEntry"));

// Works
router.get("/works", must(ResidentAdmin.worksList, "Resident.worksList"));
router.post("/works", uploadResident.single("image"), must(ResidentAdmin.createWorkItem, "Resident.createWorkItem"));
router.patch("/works/:id", uploadResident.single("image"), must(ResidentAdmin.updateWorkItem, "Resident.updateWorkItem"));
router.delete("/works/:id", must(ResidentAdmin.deleteWorkItem, "Resident.deleteWorkItem"));

// Map Markers
router.get("/map/markers", must(ResidentAdmin.mapMarkersAdminList, "Resident.mapMarkersList"));
router.post("/map/markers", must(ResidentAdmin.createMapMarker, "Resident.createMapMarker"));
router.patch("/map/markers/:id", must(ResidentAdmin.updateMapMarker, "Resident.updateMapMarker"));
router.delete("/map/markers/:id", must(ResidentAdmin.deleteMapMarker, "Resident.deleteMapMarker"));

// Ratings
router.get("/ratings", must(ResidentAdmin.ratingsSummary, "Resident.ratingsSummary"));

// Market
router.get("/market/products", must(ResidentAdmin.marketProductsAdmin, "Resident.marketProducts"));
router.patch("/market/products/:id/approve", must(ResidentAdmin.marketApproveProduct, "Resident.marketApprove"));
router.patch("/market/products/:id/reject", must(ResidentAdmin.marketRejectProduct, "Resident.marketReject"));
router.delete("/market/products/:id", must(ResidentAdmin.marketDeleteProduct, "Resident.marketDelete"));

router.get("/market/orders", must(ResidentAdmin.marketOrdersAdmin, "Resident.marketOrders"));
router.patch("/market/orders/:id/status", must(ResidentAdmin.marketUpdateOrderStatus, "Resident.updateOrderStatus"));

// Chat
router.get("/chat/rooms", must(ResidentAdmin.adminListRooms, "Resident.adminListRooms"));
router.get("/chat/messages/:roomId", must(ResidentAdmin.adminListMessages, "Resident.adminListMessages"));
router.post("/chat/messages", must(ResidentAdmin.adminSendMessage, "Resident.adminSendMessage"));

// Chat moderation
router.get("/chat/reports", must(ResidentAdmin.reportedMessagesList, "Resident.chatReports"));
router.delete("/chat/messages/:id", must(ResidentAdmin.adminDeleteMessage, "Resident.deleteMessage"));

// Budget
router.get("/budget", must(ResidentAdmin.budgetDocsList, "Resident.budgetList"));
router.post("/budget", must(ResidentAdmin.createBudgetEntry, "Resident.createBudgetEntry"));
router.delete("/budget/:id", must(ResidentAdmin.deleteBudgetDoc, "Resident.deleteBudget"));

// =============================================================================
// VISITOR ADMIN ROUTES (Mounted at /admin/visitor/...)
// =============================================================================

// Towns
router.get("/visitor/towns", must(VisitorAdmin.listTowns, "Visitor.listTowns"));
router.post("/visitor/towns", uploadVisitor.single("heroImage"), (req, res, next) => {
    if (!req.body.townSlug && req.body.townName) {
        req.body.townSlug = slugify(req.body.townName, { lower: true, strict: true });
    }
    next();
}, must(VisitorAdmin.createTown, "Visitor.createTown"));
router.patch("/visitor/towns/:id", uploadVisitor.single("heroImage"), must(VisitorAdmin.updateTown, "Visitor.updateTown"));
router.delete("/visitor/towns/:id", must(VisitorAdmin.deleteTown, "Visitor.deleteTown"));

// Visitor Sub-resources (using requireTownScope)
router.get("/visitor/:townSlug/trending", requireTownScope, must(VisitorAdmin.listTrending, "Visitor.trendingList"));
router.post("/visitor/:townSlug/trending", requireTownScope, uploadVisitor.single("image"), must(VisitorAdmin.addTrending, "Visitor.trendingAdd"));
router.delete("/visitor/trending/:id", must(VisitorAdmin.deleteTrending, "Visitor.trendingDelete"));

router.get("/visitor/:townSlug/places", requireTownScope, must(VisitorAdmin.listPlaces, "Visitor.placesList"));
router.post("/visitor/:townSlug/places", requireTownScope, uploadVisitor.array("images", 6), must(VisitorAdmin.addPlace, "Visitor.placesAdd"));
router.delete("/visitor/places/:id", must(VisitorAdmin.deletePlace, "Visitor.placesDelete"));

router.get("/visitor/:townSlug/announcements", requireTownScope, must(VisitorAdmin.listAnnouncements, "Visitor.announcementsList"));
router.post("/visitor/:townSlug/announcements", requireTownScope, must(VisitorAdmin.addAnnouncement, "Visitor.announcementsAdd"));
router.delete("/visitor/announcements/:id", must(VisitorAdmin.deleteAnnouncement, "Visitor.announcementsDelete"));

router.get("/visitor/:townSlug/emergency", requireTownScope, must(VisitorAdmin.listEmergency, "Visitor.emergencyList"));
router.post("/visitor/:townSlug/emergency", requireTownScope, must(VisitorAdmin.addEmergency, "Visitor.emergencyAdd"));
router.delete("/visitor/emergency/:id", must(VisitorAdmin.deleteEmergency, "Visitor.emergencyDelete"));

router.get("/visitor/:townSlug/travel", requireTownScope, must(VisitorAdmin.listTravel, "Visitor.travelList"));
router.post("/visitor/:townSlug/travel", requireTownScope, must(VisitorAdmin.addTravel, "Visitor.travelAdd"));
router.delete("/visitor/travel/:id", must(VisitorAdmin.deleteTravel, "Visitor.travelDelete"));


router.get("/visitor/:townSlug/complaints", requireTownScope, must(VisitorAdmin.listComplaints, "Visitor.complaintsList"));
router.patch("/visitor/complaints/:id/resolve", must(VisitorAdmin.resolveComplaint, "Visitor.resolveComplaint"));

// Warnings
router.get("/visitor/:townSlug/warnings", requireTownScope, must(VisitorAdmin.listWarningPlaces, "Visitor.warningsList"));
router.post("/visitor/:townSlug/warnings", requireTownScope, uploadVisitor.single("image"), must(VisitorAdmin.addWarningPlace, "Visitor.warningsAdd"));
router.delete("/visitor/warnings/:id", must(VisitorAdmin.deleteWarningPlace, "Visitor.warningsDelete"));

// Town Info (Chatbot)
router.get("/visitor/:townSlug/info", requireTownScope, must(VisitorAdmin.listTownInfo, "Visitor.infoList"));
router.post("/visitor/:townSlug/info", requireTownScope, must(VisitorAdmin.addTownInfo, "Visitor.infoAdd"));
router.delete("/visitor/info/:id", must(VisitorAdmin.deleteTownInfo, "Visitor.infoDelete"));

// Map Buildings (3D Map)
router.get("/visitor/:townSlug/map-buildings", requireTownScope, must(VisitorAdmin.listMapBuildings, "Visitor.mapBuildingsList"));
router.post("/visitor/:townSlug/map-buildings", requireTownScope, uploadVisitor.single("image"), must(VisitorAdmin.addMapBuilding, "Visitor.mapBuildingsAdd"));
router.delete("/visitor/map-buildings/:id", must(VisitorAdmin.deleteMapBuilding, "Visitor.mapBuildingsDelete"));

// Services (On-Demand / Govt / Emergency Icons)
router.get("/visitor/:townSlug/services", requireTownScope, must(VisitorAdmin.listServices, "Visitor.servicesList"));
router.post("/visitor/:townSlug/services", requireTownScope, uploadVisitor.single("icon"), must(VisitorAdmin.addService, "Visitor.servicesAdd"));
router.delete("/visitor/services/:id", must(VisitorAdmin.deleteService, "Visitor.servicesDelete"));

// =============================================================================
// TOWN MANAGEMENT (NEW)
// =============================================================================
router.get("/towns", must(TownController.listTowns, "Town.list"));
router.get("/towns/:id", must(TownController.getTown, "Town.get"));
router.post("/towns", must(TownController.createTown, "Town.create"));
router.put("/towns/:id", must(TownController.updateTown, "Town.update"));
router.delete("/towns/:id", must(TownController.deleteTown, "Town.delete"));
// Custom Map Layout
router.put("/towns/:id/layout", must(TownController.updateLayout, "Town.updateLayout"));

module.exports = router;
