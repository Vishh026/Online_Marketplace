const express = require("express");
const CreateAuthMiddleware = require("../middlewares/auth.middleware");
const orderController = require("../controllers/orders.controller");
const {
  createOrderValidation,
} = require("../middlewares/validation.middleware");
const validation = require('../middlewares/validation.middleware')
const router = express.Router();

router.post(
  "/create",
  CreateAuthMiddleware(["user"]),
  createOrderValidation,
  orderController.createOrder,
);

router.get("/me",CreateAuthMiddleware(["user"]),orderController.getMyOrder)
router.get("/me/:orderId",CreateAuthMiddleware(["user"]),orderController.getOrderById)
router.post("/me/:orderId",CreateAuthMiddleware(["user"]),orderController.cancelOrderById)
router.patch("/:orderId/address", CreateAuthMiddleware([ "user" ]),validation.updateAddressValidation, orderController.updateOrderAddress)

module.exports = router;
