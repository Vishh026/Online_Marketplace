const cartModel = require("../model/cart.model");
const ApiResponse = require("../Utilities/ApiResponse");
const ApiError = require("../Utilities/ApiError");
const axios = require("axios");

async function addItemsToCart(req, res, next) {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    // 1️⃣ Fetch or create cart
    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      cart = new cartModel({ user: userId, items: [] });
    }

    // 2️⃣ Fetch product from Product Service
    let product;
    try {
      const productResponse = await axios.get(
        `http://localhost:3001/api/products/${productId}`
      );

      product = productResponse.data.data; 
    } catch (err) {
      return next(new ApiError(502, "Product service unavailable"));
    }

    if (!product) {
      return next(new ApiError(404, "Product not found"));
    }

    if (product.stock <= 0) {
      return next(new ApiError(400, "Product is out of stock"));
    }

    // 3️⃣ Check existing cart item
    const existingCartItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    let newQuantity = quantity;

    if (existingCartItemIndex >= 0) {
      newQuantity += cart.items[existingCartItemIndex].quantity;
    }

    // 4️⃣ Validate total quantity against stock
    if (newQuantity > product.stock) {
      return next(
        new ApiError(400, `Only ${product.stock} items available in stock`)
      );
    }

    // 5️⃣ Update cart
    if (existingCartItemIndex >= 0) {
      cart.items[existingCartItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    await cart.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Item added to the cart", cart));
  } catch (error) {
    next(error);
  }
}

async function getCart(req, res, next) {
  try {
    const userId = req.user._id;

    let cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await cartModel.create({ user: userId, items: [] });
    }

    return res.status(200).json(
      new ApiResponse(200, "Product fetched successfully", {
        cart,
        totals: {
          itemCount: cart.items.length,
          totalQuantity: cart.items.reduce(
            (sum, item) => sum + (item.quantity || 0),
            0,
          ),
        },
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function updateProductQuantity(req, res, next) {
  try {
    const { productId } = req.params;
    const userId = req.user._id;
    const { quantity } = req.body;

    let cart = await cartModel.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json(new ApiError(404, "Cart not found"));
    }
    const existingCartIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (existingCartIndex == -1) {
      return res.status(404).json(new ApiError(404, "Item not found"));
    }

    cart.items[existingCartIndex].quantity = quantity;
    await cart.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Cart updated succesfully", cart));
  } catch (error) {
    next(error);
  }
}

async function removeCartItem(req, res, next) {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const cart = await cartModel.findOneAndUpdate(
      { user: userId, "items.productId": productId },
      { $pull: { items: { productId } } },
      { new: true },
    );

    if (!cart) {
      return res
        .status(404)
        .json(new ApiError(404, "Product not in cart or cart not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Item removed successfully", cart));
  } catch (error) {
    next(error);
  }
}

async function deleteCart(req, res, next) {
  try {
    const userId = req.user._id;
    const cart = await cartModel.findOne({ user: userId });

    if (!cart) {
      return res.status(403).json(new ApiError(403, "Cart not found"));
    }
    cart.items = [];
    await cart.save();

    return res.status(200).json(new ApiResponse(200, "Item deleted!", cart));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addItemsToCart,
  getCart,
  updateProductQuantity,
  removeCartItem,
  deleteCart,
};
