const {
  addItemsToCart,
  getCart,
  updateProductQuantity,
  removeCartItem,
  deleteCart,
} = require("../src/controllers/cart.controller");

const cartModel = require("../src/model/cart.model");
const ApiError = require("../src/Utilities/ApiError");

jest.mock("../src/model/cart.model")

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();


describe("addItemsToCart", () => {
  it("should create cart and add item if cart does not exist", async () => {
    const req = {
      user: { _id: "user1" },
      body: { productId: "prod1", quantity: 2 },
    };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue(null);

    cartModel.mockImplementation(() => ({
      user: "user1",
      items: [{ productId: "prod1", quantity: 2 }],
      save: jest.fn(),
    }));

    await addItemsToCart(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it("should increase quantity if product already exists", async () => {
    const save = jest.fn();

    const req = {
      user: { _id: "user1" },
      body: { productId: "prod1", quantity: 1 },
    };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue({
      items: [{ productId: "prod1", quantity: 1 }],
      save,
    });

    await addItemsToCart(req, res, mockNext);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getCart", () => {
  it("should return existing cart", async () => {
    const req = { user: { _id: "user1" } };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue({
      items: [{ quantity: 2 }, { quantity: 3 }],
    });

    await getCart(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it("should create cart if not found", async () => {
    const req = { user: { _id: "user1" } };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue(null);
    cartModel.create.mockResolvedValue({ items: [] });

    await getCart(req, res, mockNext);

    expect(cartModel.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("updateProductQuantity", () => {
  it("should return 404 if cart not found", async () => {
    const req = {
      user: { _id: "user1" },
      params: { productId: "prod1" },
      body: { quantity: 2 },
    };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue(null);

    await updateProductQuantity(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should update quantity if item exists", async () => {
    const save = jest.fn();

    const req = {
      user: { _id: "user1" },
      params: { productId: "prod1" },
      body: { quantity: 5 },
    };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue({
      items: [{ productId: "prod1", quantity: 1 }],
      save,
    });

    await updateProductQuantity(req, res, mockNext);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
describe("removeCartItem", () => {
  it("should remove item from cart", async () => {
    const req = {
      user: { _id: "user1" },
      params: { productId: "prod1" },
    };
    const res = mockRes();

    cartModel.findOneAndUpdate.mockResolvedValue({
      items: [],
    });

    await removeCartItem(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 404 if item not found", async () => {
    const req = {
      user: { _id: "user1" },
      params: { productId: "prod1" },
    };
    const res = mockRes();

    cartModel.findOneAndUpdate.mockResolvedValue(null);

    await removeCartItem(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
describe("deleteCart", () => {
  it("should clear cart", async () => {
    const save = jest.fn();

    const req = { user: { _id: "user1" } };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue({
      items: [{ productId: "p1" }],
      save,
    });

    await deleteCart(req, res, mockNext);

    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("should return 403 if cart not found", async () => {
    const req = { user: { _id: "user1" } };
    const res = mockRes();

    cartModel.findOne.mockResolvedValue(null);

    await deleteCart(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

