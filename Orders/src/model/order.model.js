const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
});

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  quantity: {
    type: Number,
    min: 1,
    required: true,
  },

  unitPrice: {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: ["USD", "INR"],
    },
  },
  totalPrice: {
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      enum: ["USD", "INR"],
    },
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    items: [orderItemSchema],
    status: {
      type: String,
      enum: ["PENDING", "CANCELLED", "SHIPPED", "DELIVERD"]
    },
    pricing: {
      total: {
        amount: {
          type: Number,
          required: true,
        },
        currency: { type: String, required: true },
      },
    },
    shippingAddress: {
      type: addressSchema,
      required: true,
    },
  },

  { timestamps: true },
);

const orderModel = mongoose.model("order", orderSchema);

module.exports = orderModel;
