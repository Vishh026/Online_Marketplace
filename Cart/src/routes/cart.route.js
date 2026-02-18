const express = require("express");
const createAuthMiddleware = require("../middleware/auth.middleware");
const cartController = require("../controllers/cart.controller");
const validationMiddleware = require("../middleware/validation.middleware");
const router = express.Router();

router.post(
  "/",
  validationMiddleware.validateAddItemToCart,
  createAuthMiddleware(["user"]),
  cartController.addItemsToCart,
);

router.get("/items", createAuthMiddleware(["user"]), cartController.getCart);

router.patch(
  "/items/:productId",
   createAuthMiddleware(["user"]),
  validationMiddleware.validateUpdateCartItem,
  cartController.updateProductQuantity,
)
router.delete("/items/:productId",createAuthMiddleware(["user"]), cartController.removeCartItem)
router.delete("/clear",createAuthMiddleware(["user"]), cartController.deleteCart)

module.exports = router;
