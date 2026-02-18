const request = require("supertest");
const app = require("../src/app");
const orderModel = require("../src/model/order.model");
const testDB = require("./setupTestDB");

jest.mock("../src/middlewares/auth.middleware", () => {
  return () => (req, res, next) => {
    req.user = { _id: "696d3570b9b52a4a66caed64", role: "user" };
    next();
  };
});

beforeAll(async () => testDB.connect());
afterEach(async () => testDB.clearDatabase());
afterAll(async () => testDB.closeDatabase());

describe("GET /api/order/me", () => {
  it("should return my orders with pagination meta", async () => {
    await orderModel.create({
      user: "696d3570b9b52a4a66caed64",
      items: [],
      status: "PENDING",
      pricing: { total: { amount: 0, currency: "INR" } },
      shippingAddress: {
        street: "MG Road",
        city: "Nashik",
        state: "MH",
        zip: "422001",
        country: "India",
      },
    });

    const res = await request(app).get("/api/order/me?page=1&limit=20");

    expect(res.statusCode).toBe(200);
    expect(res.body.data.orders.length).toBe(1);
    expect(res.body.data.meta.total).toBe(1);
  });
});
