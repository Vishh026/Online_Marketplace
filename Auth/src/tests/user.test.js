const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserAddress,
  addUserAddress,
  deleteUserAddress
} = require("../controllers/auth.controller");

const userModel = require("../model/user.model");
const ApiError = require("../Utilities/ApiError");

jest.mock("../model/user.model");

describe("User Controller Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: "user123", address: [] }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };

    next = jest.fn();
  });

  
  it("registerUser → should return 409 if user exists", async () => {
    userModel.findOne.mockResolvedValue(true);

    req.body = {
      name: { firstName: "A", lastName: "B" },
      username: "test",
      email: "test@test.com",
      password: "123"
    };

    await registerUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it("registerUser → should create user and return 201", async () => {
    userModel.findOne.mockResolvedValue(null);

    const mockUser = {
      _id: "1",
      username: "test",
      email: "test@test.com",
      role: "user",
      getJWT: jest.fn().mockReturnValue("token123")
    };

    userModel.create.mockResolvedValue(mockUser);

    req.body = {
      name: { firstName: "A", lastName: "B" },
      username: "test",
      email: "test@test.com",
      password: "123"
    };

    await registerUser(req, res, next);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });


  it("loginUser → should return 401 if user not found", async () => {
    userModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await loginUser(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it("loginUser → should login successfully", async () => {
    const mockUser = {
      _id: "1",
      username: "test",
      email: "test@test.com",
      role: "user",
      address: [],
      comparePassword: jest.fn().mockReturnValue(true),
      getJWT: jest.fn().mockReturnValue("token123")
    };

    userModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser)
    });

    req.body = { email: "test@test.com", password: "123" };

    await loginUser(req, res, next);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("logoutUser → should clear cookie", async () => {
    await logoutUser(req, res, next);

    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });


  it("getCurrentUser → should return current user", async () => {
    await getCurrentUser(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  
  it("getUserAddress → should return 404 if user not found", async () => {
    userModel.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });

    await getUserAddress(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
  });

  it("addUserAddress → should add address", async () => {
    userModel.findOneAndUpdate.mockResolvedValue({
      address: [{ city: "Pune" }]
    });

    await addUserAddress(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("deleteUserAddress → should delete address", async () => {
    userModel.updateOne.mockResolvedValue({ modifiedCount: 1 });

    req.params.addressId = "addr1";

    await deleteUserAddress(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
  });
});
