const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../src/app");
const orderModel = require("../src/model/order.model");
const testDB = require("./setupTestDB");

jest.mock("../src/middlewares/auth.middleware", () => {
  return () => (req, res, next) => {
    req.user = { _id: "696d3570b9b52a4a66caed64", role: "user" };
    next();
  };
});

jest.mock("../src/Utilities/helper", () => {
  const mongoose = require("mongoose");

  // ✅ create ids INSIDE the mock scope
  const p1 = new mongoose.Types.ObjectId();
  const p2 = new mongoose.Types.ObjectId();

  return {
    extractToken: jest.fn(() => "fake-token"),
    extractShippingAddress: jest.fn(() => ({
      street: "MG Road",
      city: "Nashik",
      state: "MH",
      zip: "422001",
      country: "India",
    })),

    fetchCartItems: jest.fn(() => [
      { productId: p1.toString(), quantity: 2 },
      { productId: p2.toString(), quantity: 1 },
    ]),

    fetchProducts: jest.fn(() => [
      {
        _id: p1,
        stock: 10,
        title: "Shirt",
        price: { amount: 100, currency: "INR" },
      },
      {
        _id: p2,
        stock: 10,
        title: "Shoes",
        price: { amount: 500, currency: "INR" },
      },
    ]),

    buildOrderItems: jest.fn(() => ({
      totalAmount: 700,
      orderItems: [
        {
          product: p1,
          quantity: 2,
          unitPrice: { amount: 100, currency: "INR" },
          totalPrice: { amount: 200, currency: "INR" },
        },
        {
          product: p2,
          quantity: 1,
          unitPrice: { amount: 500, currency: "INR" },
          totalPrice: { amount: 500, currency: "INR" },
        },
      ],
    })),

    clearCart: jest.fn(() => true),
  };
});

beforeAll(async () => testDB.connect());
afterEach(async () => testDB.clearDatabase());
afterAll(async () => testDB.closeDatabase());

describe("POST /api/order/create", () => {
  it("should create an order and return 201", async () => {
    const res = await request(app)
      .post("/api/order/create")
      .send({
        shippingAddress: {
          street: "MG Road",
          city: "Nashik",
          state: "MH",
          pincode: "422001",
          country: "India",
        },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe("Order created successfully");

    const ordersInDB = await orderModel.find();
    expect(ordersInDB.length).toBe(1);
    expect(ordersInDB[0].pricing.total.amount).toBe(700);
  });
});
