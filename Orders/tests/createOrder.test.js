const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../src/app"); // make sure app.js exports app
const orderModel = require("../src/model/order.model");

const testDB = require("./setupTestDB");

// ✅ Jest allows only mock* variables inside jest.mock()
const mockP1 = new mongoose.Types.ObjectId();
const mockP2 = new mongoose.Types.ObjectId();

jest.mock("../src/middlewares/auth.middleware", () => {
  const mongoose = require("mongoose");

  return () => (req, res, next) => {
    req.user = {
      _id: new mongoose.Types.ObjectId(),
      role: "user",
    };
    next();
  };
});

// ✅ Mock helper methods
jest.mock("../src/Utilities/helper", () => {
  const actual = jest.requireActual("../src/Utilities/helper");

  return {
    ...actual,

    extractToken: jest.fn(() => "mockToken"),

    extractShippingAddress: jest.fn(() => ({
      street: "MG Road",
      city: "Nashik",
      state: "Maharashtra",
      pincode: "422001",
      country: "India",
    })),

    fetchCartItems: jest.fn(() => [
      { productId: mockP1.toString(), quantity: 2 },
      { productId: mockP2.toString(), quantity: 1 },
    ]),

    fetchProducts: jest.fn(() => [
      {
        _id: mockP1.toString(),
        title: "Product 1",
        stock: 10,
        price: { amount: 100, currency: "INR" },
      },
      {
        _id: mockP2.toString(),
        title: "Product 2",
        stock: 10,
        price: { amount: 200, currency: "INR" },
      },
    ]),

    clearCart: jest.fn(() => Promise.resolve()),
  };
});

beforeAll(async () => {
  await testDB.connect();
});

afterEach(async () => {
  await testDB.clearDatabase();
});

afterAll(async () => {
  await testDB.closeDatabase();
});

describe("POST /api/order/create", () => {
  it("should create an order and return 201", async () => {
    const res = await request(app)
      .post("/api/order/create")
      .send({
        shippingAddress: {
          street: "MG Road",
          city: "Nashik",
          state: "Maharashtra",
          pincode: "422001",
          country: "India",
        },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Order created successfully");

    expect(res.body.data).toBeDefined();
    expect(res.body.data.items.length).toBe(2);

    // check DB
    const orders = await orderModel.find();
    expect(orders.length).toBe(1);
  });

  it("should return 500 if DB create fails", async () => {
    jest.spyOn(orderModel, "create").mockImplementationOnce(() => {
      throw new Error("DB error");
    });

    const res = await request(app)
      .post("/api/order/create")
      .send({
        shippingAddress: {
          street: "MG Road",
          city: "Nashik",
          state: "Maharashtra",
          pincode: "422001",
          country: "India",
        },
      });

    expect(res.statusCode).toBe(500);
  });
});
