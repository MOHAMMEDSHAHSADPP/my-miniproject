// back/Routes/ResidentPublicRoutes.js
const express = require("express");
const router = express.Router();

const path = require("path");
const fs = require("fs");
const multer = require("multer");

const auth = require("../Middlewares/authMiddleware");

// ================= CONTROLLERS =================
const ResidentPublic = require("../Controllers/ResidentPublicController");
const ResidentChat = require("../Controllers/ResidentChatController");
const ResidentTickets = require("../Controllers/ResidentTicketController");
const ResidentServices = require("../Controllers/ResidentServiceController");
const ResidentMarket = require("../Controllers/ResidentMarketController");


// ================= MULTER =================
const uploadDir = path.join(__dirname, "..", "uploads", "resident");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});

const upload = multer({ storage });

// ================= ROUTES =================

// ME (profile shortcut)
router.get("/me", auth, async (req, res) => {
  try {
    const User = require("../Models/User");
    const safe = await User.findById(req.user._id).select("-password").lean();
    if (!safe) return res.status(404).json({ message: "User not found" });
    res.json(safe);
  } catch (e) {
    res.status(500).json({ message: "Server error" });
  }
});

// HOME
router.get("/home", auth, ResidentPublic.home);

// PROFILE
router.get("/profile", auth, ResidentPublic.getProfile);
router.put("/profile", auth, ResidentPublic.updateProfile);

// NOTIFICATIONS
router.get("/notifications", auth, ResidentPublic.notificationsList);
router.get("/notifications/unread-count", auth, ResidentPublic.notificationsUnreadCount);
router.put("/notifications/:id/read", auth, ResidentPublic.notificationMarkRead);
router.put("/notifications/read-all", auth, ResidentPublic.notificationsMarkAllRead);

// ALERTS + GOV NOTICES
router.get("/alerts", auth, ResidentPublic.alertsList);
router.get("/gov-notices", auth, ResidentPublic.govNoticesList);
router.put("/gov-notices/:id/done", auth, ResidentPublic.govNoticeMarkDone);

// EVENTS
router.get("/events", auth, ResidentPublic.eventsList);
router.put("/events/:id/rsvp", auth, ResidentPublic.eventRSVP);

// SUGGESTIONS
router.post("/suggestions", auth, ResidentPublic.createSuggestion);
router.get("/suggestions/mine", auth, ResidentPublic.listMySuggestions);

// FEED
router.get("/feed", auth, ResidentPublic.feedListApproved);
router.post("/feed/submit", auth, upload.single("image"), ResidentPublic.feedSubmit);

// DOCUMENTS
router.get("/docs", auth, ResidentPublic.docsListMine);
router.post("/docs/upload", auth, upload.single("file"), ResidentPublic.docsUpload);

// DIRECTORY + CHATBOT
router.get("/directory", auth, ResidentPublic.directorySearch);
router.post("/chatbot", auth, ResidentPublic.chatbot);

// CHAT
// CHAT
router.get("/chat", auth, ResidentChat.listMessages); // Unified list
router.post("/chat", auth, upload.single("image"), ResidentChat.sendMessage); // Unified send

router.delete("/chat/message/:messageId", auth, ResidentChat.deleteForMe);
router.post("/chat/message/:messageId/report", auth, ResidentChat.reportMessage);

// DEPRECATED / REMOVED ROUTES that are no longer supported by controller:
// router.get("/chat/town/messages", ...);
// router.post("/chat/town/messages", ...);
// router.get("/chat/ward/messages", ...);
// router.post("/chat/ward/messages", ...);
// ... DM handled via unified route /chat?room=dm&otherUserId=...

router.delete("/chat/message/:messageId", auth, ResidentChat.deleteForMe);
router.post("/chat/message/:messageId/report", auth, ResidentChat.reportMessage);

// TICKETS + COMPLAINTS
router.get("/tickets", auth, ResidentTickets.listMyTickets);
router.post("/tickets", auth, upload.single("image"), ResidentTickets.createTicket);
router.get("/tickets/:id", auth, ResidentTickets.readTicket);
router.post("/tickets/:id/reply", auth, upload.single("image"), ResidentTickets.replyToTicket);
router.put("/tickets/:id/close", auth, ResidentTickets.closeTicket);

router.get("/complaints", auth, ResidentTickets.listMyComplaints);
router.post("/complaints", auth, upload.single("image"), ResidentTickets.createComplaint);

// SERVICES
router.get("/services/requests", auth, ResidentServices.listMyRequests);
router.post("/services/requests", auth, ResidentServices.createRequest);
router.get("/services/requests/:id", auth, ResidentServices.getRequest);

router.get("/map/markers", auth, ResidentServices.listMarkers);
router.get("/works", auth, ResidentServices.listWorks);

// VOLUNTEERS + POLLS
router.get("/volunteers/me", auth, ResidentServices.getMyVolunteerProfile);
router.post("/volunteers/register", auth, ResidentServices.registerVolunteer);

router.get("/polls", auth, ResidentServices.listPolls);
router.post("/polls/:pollId/vote", auth, ResidentServices.votePoll);

// RATINGS + BUDGET
router.get("/ratings/mine", auth, ResidentServices.listMyRatings);
router.post("/ratings", auth, ResidentServices.createRating);

router.get("/budget", auth, ResidentServices.listBudgetDocs);

// MARKET
router.get("/market", auth, ResidentMarket.listProducts); // Matches frontend /resident/market?town=...
router.post("/market", auth, upload.array("images", 5), ResidentMarket.createProduct); // Matches frontend /resident/market POST
router.get("/market/my-products", auth, ResidentMarket.listMyProducts); // Matches frontend /resident/market/my-products

router.get("/market/products", auth, ResidentMarket.listProducts);
router.get("/market/products/:id", auth, ResidentMarket.getProduct);
router.post("/market/products", auth, upload.array("images", 5), ResidentMarket.createProduct);
router.put("/market/products/:id", auth, upload.array("images", 5), ResidentMarket.updateProduct);
router.delete("/market/products/:id", auth, ResidentMarket.deleteProduct);

router.post("/market/orders", auth, ResidentMarket.createOrderCOD);
router.get("/market/orders/mine", auth, ResidentMarket.listMyOrders);
router.put("/market/orders/:id/cancel", auth, ResidentMarket.cancelMyOrder);

router.get("/market/seller/orders", auth, ResidentMarket.listSellerOrders);
router.put("/market/seller/orders/:id/accept", auth, ResidentMarket.sellerAcceptOrder);
router.put("/market/seller/orders/:id/reject", auth, ResidentMarket.sellerRejectOrder);
router.put("/market/seller/orders/:id/delivered", auth, ResidentMarket.sellerMarkDelivered);

module.exports = router;