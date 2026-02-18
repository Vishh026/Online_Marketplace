const ApiError = require("../Utilities/ApiError");
const ApiResponse = require("../Utilities/ApiResponse");
const axios = require("axios");

const extractToken = (req) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Authorization token missing");
  }

  return token;
};

const extractShippingAddress = (req) => {
  const { shippingAddress } = req.body;

  if (!shippingAddress) {
    throw new ApiError(401, "Shipping Address not found");
  }

  return {
    street: req.body.shippingAddress.street,
    city: req.body.shippingAddress.city,
    state: req.body.shippingAddress.state,
    zip: req.body.shippingAddress.pincode,
    country: req.body.shippingAddress.country,
  };
};

const fetchProducts = async (token, cartItems) => {
  const products = await Promise.all(
    cartItems.map(async (item, index) => {
      const productResponse = await axios.get(
        `http://localhost:3001/api/products/${item.productId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return productResponse.data.data;
    }),
  );
  return products;
};

const fetchCartItems = async (token) => {
  const cartResponse = await axios.get("http://localhost:3002/api/cart/items", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const cartItems = cartResponse?.data?.data?.cart?.items;

  if (!cartItems || cartItems.length == 0) {
    throw new ApiError(400, "Cart is Empty");
  }

  return cartItems;
};

const clearCart = async (token) => {
  await axios.delete("http://localhost:3002/api/cart/clear", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

const buildOrderItems = (cartItems, products) => {
  let totalAmount = 0;

  // map through cartItem => find the product
  const orderItems = cartItems.map((item) => {
    const product = products.find(
      (p) => p._id.toString() === item.productId.toString(),
    );
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.stock < item.quantity) {
      throw new ApiError(
        409,
        `Product ${product.title} is out of stock or insufficient stock`,
      );
    }

    const unitPrice = product.price.amount;
    const ItemTotal = unitPrice * item.quantity;

    totalAmount += ItemTotal;

    return {
      product: item.productId,
      quantity: item.quantity,

      unitPrice: {
        amount: unitPrice,
        currency: product.price.currency,
      },
      totalPrice: {
        amount: ItemTotal,
        currency: product.price.currency,
      },
    };
  });
  return { orderItems, totalAmount };
};

module.exports = {
  extractToken,
  extractShippingAddress,
  fetchProducts,
  fetchCartItems,
  buildOrderItems,
  clearCart
};
