jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));

jest.mock("../src/model/product.model");

const mongoose = require("mongoose");
const { updateProductById } = require("../src/controllers/product.controller");
const productModel = require("../src/model/product.model");


jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);

describe("updateProductById controller", () => {
  it("should update product successfully", async () => {
    const mockProduct = {
      seller: "123",
      price: { amount: 100, currency: "INR" },
      save: jest.fn()
    };

    productModel.findById.mockResolvedValue(mockProduct);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" }, // valid ObjectId
      body: { price: { amount: 500 } },
      user: { _id: "123" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await updateProductById(req, res, next);

    expect(mockProduct.price.amount).toBe(500);
    expect(mockProduct.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should throw error if seller is not owner", async () => {
    const mockProduct = {
      seller: "someoneElse"
    };

    productModel.findById.mockResolvedValue(mockProduct);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      body: {},
      user: { _id: "123" }
    };

    const res = {};
    const next = jest.fn();

    await updateProductById(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
