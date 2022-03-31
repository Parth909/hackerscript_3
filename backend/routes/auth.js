const express = require("express");
const router = express.Router();

// Validators
const {
  userRegisterValidator,
  userLoginValidator,
} = require("../validators/auth");

// validator functions to check if the validators are satisfied
const { runValidation } = require("../validators/index");

// Controllers
const { register, registerActivate, login } = require("../controllers/auth");

router.post("/register", userRegisterValidator, runValidation, register);
router.post("/register/activate", registerActivate);

// Login route
router.post("/login", userLoginValidator, runValidation, login);

module.exports = router;
