const express = require("express");
const authController = require("../controllers/auth.controller");
const validators = require("../middlewares/validators.middleware");
const { authMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.get("/me", authMiddleware, authController.getCurrentUser);
router.get('/me/address',authMiddleware,authController.getUserAddress)
router.post(
  "/me/address",
  authMiddleware,
  validators.addUserAddressValidations,
  authController.addUserAddress,
);
router.delete('/me/address/:addressId',authMiddleware,authController.deleteUserAddress)

module.exports = router;
