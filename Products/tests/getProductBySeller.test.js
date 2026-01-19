jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));

jest.mock("../src/model/product.model");


const { getProductBySeller } = require("../src/controllers/product.controller");
const productModel = require("../src/model/product.model");

describe("getProductBySeller controller", () => {
  it("should return products for seller", async () => {
    const req = {
      user: { _id: "123" },
      params: { skip: 0, limit: 10 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    productModel.find.mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([{ title: "Seller Product" }])
      })
    });

    await getProductBySeller(req, res, next);

    expect(productModel.find).toHaveBeenCalledWith({ seller: "123" });
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
