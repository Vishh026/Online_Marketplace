const productModel = require("../model/product.model");
const { uploadImage } = require("../services/imagekit.service");
const ApiResponse = require("../Utilities/ApiResponse");
const ApiError = require("../Utilities/ApiError");
const mongoose = require("mongoose");

async function createProduct(req, res, next) {
  try {
    const { title, description, priceAmount, priceCurrency = "INR" } = req.body;
    const seller = req.user._id;

    const price = {
      amount: Number(priceAmount),
      currency: priceCurrency,
    };

    // Promise.all => used for async operations of multipart-form-data
    const images = await Promise.all(
      (req.files || []).map((file) => uploadImage({ buffer: file.buffer })),
    );

    const product = await productModel.create({
      title,
      description,
      price,
      images,
      seller,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, "Product created successfully", { data: product }),
      );
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const { q, minPrice, maxPrice, limit = 10, skip } = req.query;

    const filter = {};

    if (q) {
      filter.$text = { $search: q };
    }

    // 'price.amount' : its key not code
    if (minPrice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $gte: Number(minPrice),
      };
    }

    if (maxPrice) {
      filter["price.amount"] = {
        ...filter["price.amount"],
        $lte: Number(maxPrice),
      };
    }

    // Findout product in model
    const products = await productModel
      .find(filter)
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 20));

    return res.status(200).json(
      new ApiResponse(200, "Products fetched successfully", products)
    );
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    if (!id) throw new ApiError(400, "Product id required");

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, "Invalid product id");
    }

    const product = await productModel.findById(id);

    if (!product) {
      throw new ApiError(403, "product not fount");
    }

    return res.status(200).json(
      new ApiResponse(200, "Product fetched successfully", product)
    );
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

    const allowedUpdates = ["title", "description", "price"];
    let updated = false;

    for (const key of Object.keys(req.body)) {
      if (!allowedUpdates.includes(key)) continue;

      if (key === "price") {
        if (typeof req.body.price !== "object" || req.body.price === null) {
          throw new ApiError(400, "Price must be an object");
        }

        if ("amount" in req.body.price) {
          product.price.amount = Number(req.body.price.amount);
          updated = true;
        }

        if ("currency" in req.body.price) {
          product.price.currency = req.body.price.currency; // ✅ string
          updated = true;
        }
      } else {
        product[key] = req.body[key];
        updated = true;
      }
    }

    if (!updated) {
      throw new ApiError(400, "No valid fields provided for update");
    }

    await product.save();

    return res.status(200).json(
      new ApiResponse(200, "Product updated successfully", product)
    );
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
      throw new ApiError(
        403,
        "You can delete only your own product"
      );
    }


    await productModel.findByIdAndDelete(id);


    return res.status(200).json(
      new ApiResponse(200, "Product deleted successfully", product)
    );
  } catch (error) {
    next(error);
  }
}


async function getProductBySeller(req,res,next){
   try {
    const seller = req.user;
    const { skip = 0, limit = 20 } = req.params;

    const products = await productModel.find({ seller: seller._id }).skip(skip).limit(Math.min(limit, 20));

    if(!products || products.length < 0){
      throw new ApiError(403,"Product not found")
    }
    return res.status(201).json(
      new ApiResponse(201, "Seller products fetched successfully", products)
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getProductBySeller
};


