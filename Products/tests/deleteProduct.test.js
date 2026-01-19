jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));

jest.mock("../src/model/product.model");

const mongoose = require("mongoose");
const { deleteProductById } = require("../src/controllers/product.controller");
const productModel = require("../src/model/product.model");

jest.spyOn(mongoose.Types.ObjectId, "isValid").mockReturnValue(true);

describe("deleteProductById controller", () => {
  it("should delete product successfully", async () => {
    const mockProduct = {
      seller: "123"
    };

    productModel.findById.mockResolvedValue(mockProduct);
    productModel.findByIdAndDelete.mockResolvedValue(true);

    const req = {
      params: { id: "507f1f77bcf86cd799439011" },
      user: { _id: "123" }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await deleteProductById(req, res, next);

    expect(productModel.findById).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011"
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
