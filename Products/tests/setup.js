jest.mock("../src/model/product.model");
jest.mock("../src/services/imagekit.service");

const mongoose = require("mongoose");

beforeAll(() => {
  jest.spyOn(mongoose.Types.ObjectId, "isValid").mockImplementation(() => true);
});

afterEach(() => {
  jest.clearAllMocks();
});
