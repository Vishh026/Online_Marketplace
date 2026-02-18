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

describe("PATCH /api/order/:orderId/address", () => {
  it("should update address for pending order", async () => {
    const order = await orderModel.create({
      user: "696d3570b9b52a4a66caed64",
      items: [],
      status: "PENDING",
      pricing: { total: { amount: 0, currency: "INR" } },
      shippingAddress: {
        street: "Old",
        city: "Old",
        state: "Old",
        zip: "000000",
        country: "India",
      },
    });

    const res = await request(app)
      .patch(`/api/order/${order._id}/address`)
      .send({
        shippingAddress: {
          street: "New Street",
          city: "Nashik",
          state: "MH",
          pincode: "422001",
          country: "India",
        },
      });

    expect([200, 201]).toContain(res.statusCode);

    const updated = await orderModel.findById(order._id);
    expect(updated.shippingAddress.street).toBe("New Street");
  });

  it("should return 409 if order is not pending", async () => {
    const order = await orderModel.create({
      user: "696d3570b9b52a4a66caed64",
      items: [],
      status: "SHIPPED",
      pricing: { total: { amount: 0, currency: "INR" } },
      shippingAddress: {
        street: "Old",
        city: "Old",
        state: "Old",
        zip: "000000",
        country: "India",
      },
    });

    const res = await request(app)
      .patch(`/api/order/${order._id}/address`)
      .send({
        shippingAddress: {
          street: "New Street",
          city: "Nashik",
          state: "MH",
          pincode: "422001",
          country: "India",
        },
      });

    expect(res.statusCode).toBe(409);
  });
});
