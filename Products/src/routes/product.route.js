const express = require("express");
const { createProductValidators } = require("../validators/product.validator");
const productControlller = require("../controllers/product.controller");
const multer = require("multer");
const sellerAuthhMiddleware = require("../middlewares/sellerAuth.middleware");

const router = express.Router();

// Multer reads file upload from request and for Content-Type: multipart/form-data
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/create",
  sellerAuthhMiddleware(['seller','admin']),
  upload.array("images", 5),
  createProductValidators,
  productControlller.createProduct,
);

router.get("/",productControlller.getProducts)
router.get("/seller",sellerAuthhMiddleware(["seller"]),productControlller.getProductBySeller)

router.get("/:id",productControlller.getProductById)
router.patch("/:id",sellerAuthhMiddleware(['seller']),productControlller.updateProductById)
router.delete("/:id",sellerAuthhMiddleware(["seller"]),productControlller.deleteProductById)


module.exports = router;
