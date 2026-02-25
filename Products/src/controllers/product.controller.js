const productModel = require("../model/product.model");
const { uploadImage } = require("../services/imagekit.service");
const ApiResponse = require("../Utilities/ApiResponse");
const ApiError = require("../Utilities/ApiError");
const mongoose = require("mongoose");
const { publishToQueue } = require("../broker/broker");
const QUEUES = require("../constants/queues");
/**
 * RULE:
 * - All prices are stored in PAISA (smallest unit).
 * - Currency is fixed to INR.
 */

async function createProduct(req, res, next) {
  try {
    const { title, description, priceAmount } = req.body;
    const seller = req.user._id;

    if (!priceAmount || isNaN(priceAmount)) {
      throw new ApiError(400, "Valid priceAmount is required");
    }

    const amountInPaise = Math.round(Number(priceAmount) * 100);

    const images = await Promise.all(
      (req.files || []).map((file) => uploadImage({ buffer: file.buffer })),
    );

    const product = await productModel.create({
      title,
      description,
      price: {
        amount: amountInPaise, // stored in paise
        currency: "INR",
      },
      images,
      seller,
    });

    await publishToQueue(QUEUES.PRODUCT_NOTIFICATION_PRODUCT_CREATED, {
      email: req.user.email,
      username: req.user.username,
      productId: product._id,
      title: product.title,
      price: product.price.amount, // paise
    });

    await publishToQueue(QUEUES.SELLER_DASHBOARD_PRODUCT_CREATED, product);

    return res
      .status(201)
      .json(new ApiResponse(201, "Product created successfully", product));
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const { q, minPrice, maxPrice, limit = 10, skip = 0 } = req.query;

    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }

    if (minPrice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $gte: Math.round(Number(minPrice) * 100),
      };
    }

    if (maxPrice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $lte: Math.round(Number(maxPrice) * 100),
      };
    }

    const products = await productModel
      .find(filter)
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));

    return res
      .status(200)
      .json(new ApiResponse(200, "Products fetched successfully", products));
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid product id");
    }

    const product = await productModel.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Product fetched successfully", product));
  } catch (error) {
    next(error);
  }
}

async function updateProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid product id");
    }

    const product = await productModel.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can update only your own product");
    }

    const { title, description, priceAmount } = req.body;

    if (title) product.title = title;
    if (description) product.description = description;

    if (priceAmount !== undefined) {
      if (isNaN(priceAmount)) {
        throw new ApiError(400, "Invalid priceAmount");
      }

      product.price.amount = Math.round(Number(priceAmount) * 100);
    }

    await product.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Product updated successfully", product));
  } catch (error) {
    next(error);
  }
}

async function deleteProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid product id");
    }

    const product = await productModel.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.seller.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "You can delete only your own product");
    }

    await productModel.findByIdAndDelete(id);

    return res
      .status(200)
      .json(new ApiResponse(200, "Product deleted successfully", product));
  } catch (error) {
    next(error);
  }
}

async function getProductBySeller(req, res, next) {
  try {
    const { skip = 0, limit = 20 } = req.query;

    const products = await productModel
      .find({ seller: req.user.id })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));

    return res
      .status(200)
      .json(
        new ApiResponse(200, "Seller products fetched successfully", products),
      );
  } catch (error) {
    console.log(error);
    next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getProductBySeller,
};
