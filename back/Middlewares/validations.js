// back/Middlewares/validations.js
const { validateBody, trimFields } = require("./validation");

// ✅ Login validation
exports.loginValidation = [
  trimFields(["email", "password"]),
  validateBody(["email", "password"]),
];

// ✅ Resident verification (you can add/remove fields based on your verify form)
exports.residentVerifyValidation = [
  trimFields(["fullName", "houseNo", "ward", "voterId", "townName"]),
  validateBody(["fullName", "houseNo", "ward", "voterId", "townName"]),
];

// ✅ Signup after verify
exports.residentSignupAfterVerifyValidation = [
  trimFields(["name", "email", "password"]),
  validateBody(["name", "email", "password"]),
];