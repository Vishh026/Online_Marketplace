jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));

jest.mock("../src/model/product.model");


const { getProducts } = require("../src/controllers/product.controller");
const productModel = require("../src/model/product.model");

describe("getProducts controller", () => {
  it("should return list of products", async () => {
    const req = {
      query: { limit: 10 }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    productModel.find.mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([{ title: "Product 1" }])
      })
    });

    await getProducts(req, res, next);

    expect(productModel.find).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
});
