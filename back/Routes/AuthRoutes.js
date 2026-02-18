// back/Routes/AuthRoutes.js
const router = require("express").Router();
const {
  loginValidation,
  residentVerifyValidation,
  residentSignupAfterVerifyValidation,
} = require("../Middlewares/validations");
const Auth = require("../Controllers/AuthController");

// guard helper: prevents "argument handler must be a function"
function must(fn, name) {
  if (typeof fn !== "function") {
    throw new Error(`Route handler missing or not a function: ${name}`);
  }
  return fn;
}

router.post("/login", loginValidation, must(Auth.login, "Auth.login"));
router.post(
  "/resident/verify",
  residentVerifyValidation,
  must(Auth.residentVerify, "Auth.residentVerify")
);
router.post(
  "/resident/signup",
  residentSignupAfterVerifyValidation,
  must(Auth.residentSignupAfterVerify, "Auth.residentSignupAfterVerify")
);

module.exports = router;