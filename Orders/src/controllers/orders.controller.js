const orderModel = require("../model/order.model");
const ApiResponse = require("../Utilities/ApiResponse");
const mongoose = require("mongoose");
const {
  extractToken,
  extractShippingAddress,
  fetchCartItems,
  fetchProducts,
  buildOrderItems,
  clearCart,
} = require("../Utilities/helper");

const createOrder = async (req, res, next) => {
  const user = req.user;

  const token = extractToken(req);
  const address = extractShippingAddress(req);

  try {
    const cartItems = await fetchCartItems(token);
    const products = await fetchProducts(token, cartItems);

    const { totalAmount, orderItems } = buildOrderItems(cartItems, products);

    const order = await orderModel.create({
      user: user._id,
      items: orderItems,
      status: "PENDING",
      pricing: {
        total: {
          amount: totalAmount,
          currency: "INR",
        },
      },
      shippingAddress: address,
    });

    // Clear cart (do not fail order if this fails)
    try {
      await clearCart(token);
    } catch (err) {
      console.log("Cart clear failed:", err.message);
    }

    return res
      .status(201)
      .json(new ApiResponse(201, "Order created successfully", order));
  } catch (err) {
    console.log("err", err);
    next(err);
  }
};

const getMyOrder = async (req, res, next) => {
  try {
    const user = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const orders = await orderModel
      .find({ user: user._id })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalOrders = await orderModel.countDocuments({ user: user._id });

    return res.status(200).json(
      new ApiResponse(200, "Order fetched successfully", {
        orders,
        meta: {
          total: totalOrders,
          page,
          limit,
        },
      })
    );
  } catch (err) {
    console.log("err", err);
    next(err);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const user = req.user;
    const orderId = req.params.orderId;

    // ✅ validate first
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have access to this order" });
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Order fetched successfully", order));
  } catch (err) {
    next(err);
  }
};

const cancelOrderById = async (req, res, next) => {
  try {
    const user = req.user;
    const orderId = req.params.orderId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have access to this order" });
    }

    if (order.status !== "PENDING") {
      return res
        .status(409)
        .json({ message: "Order cannot be cancelled at this stage" });
    }

    order.status = "CANCELLED";
    await order.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Order Cancelled!", order));
  } catch (err) {
    next(err);
  }
};

const updateOrderAddress = async (req, res, next) => {
  try {
    const user = req.user;
    const orderId = req.params.orderId;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (!req.body.shippingAddress) {
      return res.status(400).json({ message: "shippingAddress is required" });
    }

    if (order.user.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have access to this order" });
    }

    if (order.status !== "PENDING") {
      return res
        .status(409)
        .json({ message: "Order address cannot be updated at this stage" });
    }

    order.shippingAddress = {
      street: req.body.shippingAddress.street,
      city: req.body.shippingAddress.city,
      state: req.body.shippingAddress.state,
      zip: req.body.shippingAddress.pincode,
      country: req.body.shippingAddress.country,
    };

    await order.save();

    return res
      .status(200)
      .json(new ApiResponse(200, "Address updated successfully", order));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrder,
  getOrderById,
  cancelOrderById,
  updateOrderAddress,
};
