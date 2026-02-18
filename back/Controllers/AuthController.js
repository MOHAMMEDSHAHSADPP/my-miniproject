// back/Controllers/AuthController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Models/User");
const ResidentRegistry = require("../Models/ResidentRegistry");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      isAdmin: user.isAdmin,
      townSlug: user.townSlug || "",
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function normalizeRole(role) {
  if (!role) return "";
  if (role === "town_admin") return "admin";
  return role;
}

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    if (user.isBanned) return res.status(403).json({ message: "Account banned" });

    // normalize legacy role
    if (user.role === "town_admin") {
      user.role = "admin";
      await user.save();
    }

    const token = signToken(user);
    const safeUser = await User.findById(user._id).select("-password");

    return res.json({ token, user: safeUser });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.residentVerify = async (req, res) => {
  try {
    const { fullName, houseNo, ward, voterId, townName } = req.body;

    const record = await ResidentRegistry.findOne({
      fullName: { $regex: `^${escapeRegex(fullName)}$`, $options: "i" },
      houseNo: String(houseNo).trim(),
      ward: String(ward).trim(),
      voterId: String(voterId).trim(),
      townName: String(townName).trim(),
    });

    if (!record) {
      return res.status(404).json({ message: "Resident not found in registry" });
    }

    if (record.isClaimed) {
      return res.status(409).json({ message: "This resident is already claimed" });
    }

    return res.json({
      ok: true,
      registryId: record._id,
      verifyToken: record._id, // ALIAS for frontend
      townName: record.townName,
      townSlug: record.townSlug || "",
      message: "Verified. Continue to signup.",
    });
  } catch (e) {
    console.error("RESIDENT VERIFY ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.residentSignupAfterVerify = async (req, res) => {
  try {
    let { name, email, password, registryId, verifyToken } = req.body;

    // Frontend sends verifyToken, map it to registryId
    if (!registryId && verifyToken) registryId = verifyToken;

    const exists = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already in use" });

    if (!registryId) {
      return res.status(400).json({ message: "registryId is required (verify first)" });
    }

    const record = await ResidentRegistry.findById(registryId);
    if (!record) return res.status(404).json({ message: "Invalid registryId" });
    if (record.isClaimed) return res.status(409).json({ message: "Resident already claimed" });

    const hashed = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name,
      email: String(email).trim().toLowerCase(),
      password: hashed,
      role: "resident",
      isAdmin: false,
      townName: record.townName,
      townSlug: record.townSlug || slugFromTown(record.townName),
      ward: record.ward,
      residentRegistryId: record._id,
      isBanned: false,
    });

    record.isClaimed = true;
    record.claimedByUserId = user._id;
    record.claimedAt = new Date();
    await record.save();

    const token = signToken(user);
    const safeUser = await User.findById(user._id).select("-password");

    return res.status(201).json({
      token,
      user: safeUser,
      message: "Signup successful",
    });
  } catch (e) {
    console.error("RESIDENT SIGNUP ERROR:", e);
    return res.status(500).json({ message: "Server error" });
  }
};

function escapeRegex(str = "") {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugFromTown(t = "") {
  return String(t)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}