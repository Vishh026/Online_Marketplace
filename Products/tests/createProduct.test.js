jest.mock("../src/services/imagekit.service", () => ({
  uploadImage: jest.fn(),
}));

jest.mock("../src/model/product.model");

const { createProduct } = require("../src/controllers/product.controller");
const productModel = require("../src/model/product.model");
const { uploadImage } = require("../src/services/imagekit.service");

describe("createProduct controller", () => {
  const req = {
    body: {
      title: "Boat Headphones",
      description: "Good sound",
      priceAmount: "1500",
    },
    user: { _id: "seller123" },
    files: [{ buffer: Buffer.from("fake-image") }],
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const next = jest.fn();

  it("should create product successfully", async () => {
    uploadImage.mockResolvedValue({
      url: "img-url",
      thumbnail: "thumb",
      id: "img1",
    });

    productModel.create.mockResolvedValue({
      _id: "prod123",
      title: "Boat Headphones",
    });

    await createProduct(req, res, next);

    expect(uploadImage).toHaveBeenCalled();
    expect(productModel.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should call next on error", async () => {
    productModel.create.mockRejectedValue(new Error("DB error"));

    await createProduct(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
