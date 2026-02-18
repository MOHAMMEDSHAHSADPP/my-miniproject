// back/Routes/ResidentAdminRoutes.js
const router = require("express").Router();

const auth = require("../Middlewares/authMiddleware");
const requireRole = require("../Middlewares/requireRole");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// MULTER SETUP
const uploadDir = path.join(__dirname, "..", "uploads", "resident");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const Admin = require("../Controllers/ResidentAdminController");
const Analytics = require("../Controllers/ResidentAnalyticsController");

// -------------------- SAFE CHECK --------------------
function must(fn, name) {
  if (typeof fn !== "function") {
    throw new Error(`Route handler missing or not a function: ${name}`);
  }
  return fn;
}

// -------------------- PROTECTION --------------------
router.use(auth);
// super_admin + admin (+ backward compatible town_admin)
router.use(requireRole(["super_admin", "admin", "town_admin"]));

// ============================================================================================
// CORE ADMIN ROUTES USED BY YOUR EXISTING FRONTEND
// ============================================================================================

// Resident registry
router.get("/registry", must(Admin.registryList, "Admin.registryList"));
router.post("/registry", must(Admin.registryCreate, "Admin.registryCreate"));
router.patch("/registry/:id", must(Admin.registryUpdate, "Admin.registryUpdate"));
router.delete("/registry/:id", must(Admin.registryDelete, "Admin.registryDelete"));

// Users ban/unban
router.get("/users", must(Admin.usersList, "Admin.usersList"));
router.patch("/users/:id/ban", must(Admin.banUser, "Admin.banUser"));
router.patch("/users/:id/unban", must(Admin.unbanUser, "Admin.unbanUser"));

// ============================================================================================
// RESIDENT MODULE
// ============================================================================================

// Analytics
router.get("/analytics/summary", must(Analytics.summary, "Analytics.summary"));
router.get("/analytics/complaints-by-ward", must(Analytics.complaintsByWard, "Analytics.complaintsByWard"));
router.get("/analytics/active-users", must(Analytics.activeUsers, "Analytics.activeUsers"));
router.get("/analytics/market", must(Analytics.marketStats, "Analytics.marketStats"));
router.get("/analytics/services", must(Analytics.serviceStats, "Analytics.serviceStats"));

// Notifications
router.post("/notify/town", must(Admin.broadcastTownNotification, "Admin.broadcastTownNotification"));

// Feed moderation
router.get("/feed/pending", must(Admin.feedPending, "Admin.feedPending"));
router.patch("/feed/:id/approve", must(Admin.feedApprove, "Admin.feedApprove"));
router.patch("/feed/:id/reject", must(Admin.feedReject, "Admin.feedReject"));

// Alerts / Notices
router.get("/alerts", must(Admin.alertsAdminList, "Admin.alertsAdminList"));
router.post("/alerts", must(Admin.createAlert, "Admin.createAlert"));
router.patch("/alerts/:id", must(Admin.updateAlert, "Admin.updateAlert"));
router.delete("/alerts/:id", must(Admin.deleteAlert, "Admin.deleteAlert"));

router.get("/notices", must(Admin.noticesAdminList, "Admin.noticesAdminList"));
router.post("/notices", must(Admin.createNotice, "Admin.createNotice"));
router.patch("/notices/:id", must(Admin.updateNotice, "Admin.updateNotice"));
router.delete("/notices/:id", must(Admin.deleteNotice, "Admin.deleteNotice"));

// Events
router.get("/events", must(Admin.eventsAdminList, "Admin.eventsAdminList"));
router.post("/events", upload.single("image"), must(Admin.createEvent, "Admin.createEvent"));
router.patch("/events/:id", upload.single("image"), must(Admin.updateEvent, "Admin.updateEvent"));
router.delete("/events/:id", must(Admin.deleteEvent, "Admin.deleteEvent"));

// Polls
router.get("/polls", must(Admin.pollsAdminList, "Admin.pollsAdminList"));
router.post("/polls", must(Admin.createPoll, "Admin.createPoll"));
router.patch("/polls/:id", must(Admin.updatePoll, "Admin.updatePoll"));
router.delete("/polls/:id", must(Admin.deletePoll, "Admin.deletePoll"));

// Complaints / Suggestions
router.get("/complaints", must(Admin.complaintsList, "Admin.complaintsList"));
router.patch("/complaints/:id/status", must(Admin.updateComplaintStatus, "Admin.updateComplaintStatus"));

router.get("/suggestions", must(Admin.suggestionsList, "Admin.suggestionsList"));
router.patch("/suggestions/:id/status", must(Admin.updateSuggestionStatus, "Admin.updateSuggestionStatus"));

// Tickets
router.get("/tickets", must(Admin.ticketsList, "Admin.ticketsList"));
router.patch("/tickets/:id/status", must(Admin.updateTicketStatus, "Admin.updateTicketStatus"));
router.post("/tickets/:id/reply", must(Admin.replyTicket, "Admin.replyTicket"));

// Service Requests
router.get("/services/requests", must(Admin.serviceRequestsList, "Admin.serviceRequestsList"));
router.patch("/services/requests/:id/status", must(Admin.updateServiceRequestStatus, "Admin.updateServiceRequestStatus"));

// Documents
router.get("/documents", must(Admin.documentsList, "Admin.documentsList"));
router.post("/documents/request", must(Admin.requestDocument, "Admin.requestDocument"));
router.delete("/documents/:id", must(Admin.deleteDocument, "Admin.deleteDocument"));

// Directory
router.get("/directory", must(Admin.directoryList, "Admin.directoryList"));
router.post("/directory", must(Admin.addDirectoryEntry, "Admin.addDirectoryEntry"));
router.patch("/directory/:id", must(Admin.updateDirectoryEntry, "Admin.updateDirectoryEntry"));
router.delete("/directory/:id", must(Admin.deleteDirectoryEntry, "Admin.deleteDirectoryEntry"));

// Works
router.get("/works", must(Admin.worksList, "Admin.worksList"));
router.post("/works", must(Admin.createWorkItem, "Admin.createWorkItem"));
router.patch("/works/:id", must(Admin.updateWorkItem, "Admin.updateWorkItem"));
router.delete("/works/:id", must(Admin.deleteWorkItem, "Admin.deleteWorkItem"));

// Map Markers
router.get("/map/markers", must(Admin.mapMarkersAdminList, "Admin.mapMarkersAdminList"));
router.post("/map/markers", must(Admin.createMapMarker, "Admin.createMapMarker"));
router.patch("/map/markers/:id", must(Admin.updateMapMarker, "Admin.updateMapMarker"));
router.delete("/map/markers/:id", must(Admin.deleteMapMarker, "Admin.deleteMapMarker"));

// Ratings
router.get("/ratings", must(Admin.ratingsSummary, "Admin.ratingsSummary"));

// Market
router.get("/market/products", must(Admin.marketProductsAdmin, "Admin.marketProductsAdmin"));
router.patch("/market/products/:id/approve", must(Admin.marketApproveProduct, "Admin.marketApproveProduct"));
router.patch("/market/products/:id/reject", must(Admin.marketRejectProduct, "Admin.marketRejectProduct"));
router.delete("/market/products/:id", must(Admin.marketDeleteProduct, "Admin.marketDeleteProduct"));

router.get("/market/orders", must(Admin.marketOrdersAdmin, "Admin.marketOrdersAdmin"));
router.patch("/market/orders/:id/status", must(Admin.marketUpdateOrderStatus, "Admin.marketUpdateOrderStatus"));

// Chat moderation
router.get("/chat/reports", must(Admin.reportedMessagesList, "Admin.reportedMessagesList"));
router.delete("/chat/messages/:id", must(Admin.adminDeleteMessage, "Admin.adminDeleteMessage"));

// Budget docs
router.get("/budget", must(Admin.budgetDocsList, "Admin.budgetDocsList"));
router.post("/budget", upload.single("file"), must(Admin.uploadBudgetDoc, "Admin.uploadBudgetDoc"));
router.delete("/budget/:id", must(Admin.deleteBudgetDoc, "Admin.deleteBudgetDoc"));

module.exports = router;