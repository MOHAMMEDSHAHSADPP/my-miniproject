// back/Controllers/ResidentMarketController.js
const RMarketProduct = require("../Models/RMarketProduct");
const RMarketOrder = require("../Models/RMarketOrder");
const User = require("../Models/User");
const { notifyUser } = require("../utils/notify");

function townSlugFromUser(user) {
  return String(user?.townSlug || user?.townName || "").trim().toLowerCase();
}

function fileUrl(file) {
  return file ? `/uploads/resident/${file.filename}` : "";
}

function fileUrls(files) {
  return Array.isArray(files) ? files.map((f) => fileUrl(f)).filter(Boolean) : [];
}

// ========== PRODUCTS (PLP) ==========
exports.listProducts = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const { q = "", category = "" } = req.query;

  const filter = { townSlug, isActive: true };
  if (category) filter.category = category;

  if (q) {
    filter.$or = [{ name: new RegExp(q, "i") }, { description: new RegExp(q, "i") }];
  }

  const items = await RMarketProduct.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  res.json(items);
};

exports.listMyProducts = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const items = await RMarketProduct.find({ townSlug, sellerId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(items);
};

// ========== PRODUCT (PDP) ==========
exports.getProduct = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const item = await RMarketProduct.findOne({ _id: req.params.id, townSlug }).lean();
  if (!item) return res.status(404).json({ message: "Product not found" });
  res.json(item);
};

// ========== CREATE PRODUCT ==========
exports.createProduct = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);

    const title = String(req.body.title || "").trim();
    const price = Number(req.body.price);
    const quantity = Number(req.body.quantity || 0);
    const category = String(req.body.category || "").trim();
    const description = String(req.body.description || "").trim();

    if (!title || !category) return res.status(400).json({ message: "title + category required" });
    if (!(price > 0)) return res.status(400).json({ message: "price must be > 0" });

    const images = fileUrls(req.files);

    const item = await RMarketProduct.create({
      townSlug,
      sellerId: req.user._id,
      sellerName: req.user.name,
      title,
      category,
      price,
      stockQty: quantity, // Fixed: use stockQty
      description,
      images,
      isActive: true,
    });

    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: "Create product failed", error: e.message });
  }
};

// ========== UPDATE MY PRODUCT ==========
exports.updateProduct = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);
    const item = await RMarketProduct.findOne({ _id: req.params.id, townSlug, sellerId: req.user._id });
    if (!item) return res.status(404).json({ message: "Product not found" });

    if (req.body.title !== undefined) item.title = String(req.body.title).trim();
    if (req.body.category !== undefined) item.category = String(req.body.category).trim();
    if (req.body.price !== undefined) item.price = Number(req.body.price);
    if (req.body.quantity !== undefined) item.stockQty = Number(req.body.quantity); // Fixed
    if (req.body.description !== undefined) item.description = String(req.body.description).trim();

    const newImgs = fileUrls(req.files);
    if (newImgs.length) item.images = [...(item.images || []), ...newImgs];

    await item.save();
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Update product failed", error: e.message });
  }
};

// ========== DELETE MY PRODUCT ==========
exports.deleteProduct = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const item = await RMarketProduct.findOneAndDelete({ _id: req.params.id, townSlug, sellerId: req.user._id });
  if (!item) return res.status(404).json({ message: "Product not found" });
  res.json({ ok: true });
};

// ========== CREATE ORDER (COD) ==========
exports.createOrderCOD = async (req, res) => {
  try {
    const townSlug = townSlugFromUser(req.user);
    const productId = req.body.productId;
    const qty = Number(req.body.qty || 1);
    const address = String(req.body.address || "").trim(); // Frontend sends 'address'
    const phone = String(req.body.phone || req.user.phone || "").trim();

    if (!productId) return res.status(400).json({ message: "productId required" });
    if (!(qty > 0)) return res.status(400).json({ message: "qty must be > 0" });
    if (!address) return res.status(400).json({ message: "address required" });
    if (!phone) return res.status(400).json({ message: "phone required for delivery" });

    const product = await RMarketProduct.findOne({ _id: productId, townSlug, isActive: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.sellerId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot buy your own product" });
    }

    if (product.stockQty < qty) return res.status(400).json({ message: "Not enough stock" });

    const total = qty * Number(product.price);

    const order = await RMarketOrder.create({
      townSlug,
      buyerId: req.user._id,
      buyerName: req.user.name,
      sellerId: product.sellerId,
      sellerName: product.sellerName, // captured

      productId: product._id,
      productName: product.title, // Fixed: use title
      productImage: (product.images && product.images[0]) || "",

      quantity: qty,
      itemPrice: product.price,
      totalAmount: total,

      deliveryAddress: address, // Fixed: map address -> deliveryAddress
      phone: phone,

      paymentMode: "COD",
      status: "placed",
    });

    // stock reduce
    product.stockQty -= qty; // Fixed: use stockQty
    await product.save();

    await notifyUser(req.user._id, {
      title: "Order placed",
      message: `Your COD order for "${product.title}" is placed.`,
      type: "info",
      priority: "normal",
    });

    await notifyUser(product.sellerId, {
      title: "New order received",
      message: `You received a new order for "${product.title}".`,
      type: "info",
      priority: "high",
    });

    res.status(201).json(order);
  } catch (e) {
    res.status(500).json({ message: "Order failed", error: e.message });
  }
};

// ========== BUYER ORDERS ==========
exports.listMyOrders = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const items = await RMarketOrder.find({ townSlug, buyerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(items);
};

exports.cancelMyOrder = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const order = await RMarketOrder.findOne({ _id: req.params.id, townSlug, buyerId: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (!["placed"].includes(order.status)) {
    return res.status(400).json({ message: "Cannot cancel after seller action" });
  }

  order.status = "cancelled";
  await order.save();
  res.json({ ok: true });
};

// ========== SELLER ORDERS ==========
exports.listSellerOrders = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const items = await RMarketOrder.find({ townSlug, sellerId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json(items);
};

exports.sellerAcceptOrder = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const order = await RMarketOrder.findOne({ _id: req.params.id, townSlug, sellerId: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = "accepted";
  await order.save();

  await notifyUser(order.buyerId, {
    title: "Order accepted",
    message: `Seller accepted your order for "${order.productName}".`,
    type: "info",
    priority: "high",
  });

  res.json({ ok: true });
};

exports.sellerRejectOrder = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const order = await RMarketOrder.findOne({ _id: req.params.id, townSlug, sellerId: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = "rejected";
  await order.save();

  await notifyUser(order.buyerId, {
    title: "Order rejected",
    message: `Seller rejected your order for "${order.productName}".`,
    type: "warning",
    priority: "high",
  });

  res.json({ ok: true });
};

exports.sellerMarkDelivered = async (req, res) => {
  const townSlug = townSlugFromUser(req.user);
  const order = await RMarketOrder.findOne({ _id: req.params.id, townSlug, sellerId: req.user._id });
  if (!order) return res.status(404).json({ message: "Order not found" });

  order.status = "delivered";
  await order.save();

  await notifyUser(order.buyerId, {
    title: "Order delivered",
    message: `Your order for "${order.productName}" is delivered.`,
    type: "info",
    priority: "normal",
  });

  res.json({ ok: true });
};