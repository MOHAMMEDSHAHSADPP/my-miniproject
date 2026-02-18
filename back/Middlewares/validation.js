// back/Middlewares/validation.js
const mongoose = require("mongoose");

const isNonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

exports.validateBody = (requiredFields = []) => (req, res, next) => {
  for (const f of requiredFields) {
    const val = req.body?.[f];
    const ok =
      val !== undefined &&
      val !== null &&
      (typeof val === "number" || typeof val === "boolean" || isNonEmpty(String(val)));
    if (!ok) return res.status(400).json({ message: `${f} is required` });
  }
  next();
};

exports.validateMongoId = (paramName = "id") => (req, res, next) => {
  const v = req.params?.[paramName];
  if (!mongoose.Types.ObjectId.isValid(v)) {
    return res.status(400).json({ message: `Invalid ${paramName}` });
  }
  next();
};

// For JSON-in-form fields like details="{}"
exports.parseJsonField = (fieldName) => (req, res, next) => {
  if (req.body?.[fieldName] === undefined) return next();
  try {
    req.body[fieldName] = JSON.parse(req.body[fieldName]);
    return next();
  } catch {
    return res.status(400).json({ message: `${fieldName} must be valid JSON` });
  }
};

// Trim common string inputs
exports.trimFields = (fields = []) => (req, res, next) => {
  fields.forEach((f) => {
    if (req.body?.[f] !== undefined && req.body[f] !== null) {
      req.body[f] = String(req.body[f]).trim();
    }
  });
  next();
};
