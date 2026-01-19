const {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserAddress,
  addUserAddress,
  deleteUserAddress,
} = require("../controllers/auth.controller");

const userModel = require("../model/user.model");
const ApiError = require("../Utilities/ApiError");
const redis = require("../db/redis");

// -------------------- MOCKS --------------------
jest.mock("../model/user.model");
jest.mock("../db/redis", () => ({
  set: jest.fn(),
}));

// -------------------- TEST SETUP --------------------
describe("Auth Controller Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      cookies: {},
      user: { _id: "user123", address: [] },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  // ================= REGISTER =================
  describe("registerUser", () => {
    it("should return 409 if user already exists", async () => {
      userModel.findOne.mockResolvedValue(true);

      req.body = {
        name: { firstName: "A", lastName: "B" },
        username: "test",
        email: "test@test.com",
        password: "123",
      };

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should register user and return 201", async () => {
      userModel.findOne.mockResolvedValue(null);

      const mockUser = {
        _id: "1",
        username: "test",
        email: "test@test.com",
        role: "user",
        getJWT: jest.fn().mockReturnValue("jwt-token"),
      };

      userModel.create.mockResolvedValue(mockUser);

      req.body = {
        name: { firstName: "A", lastName: "B" },
        username: "test",
        email: "test@test.com",
        password: "123",
      };

      await registerUser(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith(
        "token",
        "jwt-token",
        expect.objectContaining({
          httpOnly: true,
          maxAge: expect.any(Number),
        })
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ================= LOGIN =================
  describe("loginUser", () => {
    it("should return 401 if user not found", async () => {
      userModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await loginUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should return 401 if password is invalid", async () => {
      const mockUser = {
        comparePassword: jest.fn().mockReturnValue(false),
      };

      userModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      req.body = { email: "test@test.com", password: "wrong" };

      await loginUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should login successfully", async () => {
      const mockUser = {
        _id: "1",
        username: "test",
        email: "test@test.com",
        role: "user",
        address: [],
        comparePassword: jest.fn().mockReturnValue(true),
        getJWT: jest.fn().mockReturnValue("jwt-token"),
      };

      userModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      req.body = { email: "test@test.com", password: "123" };

      await loginUser(req, res, next);

      expect(res.cookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ================= LOGOUT =================
  describe("logoutUser", () => {
    it("should blacklist token and clear cookie", async () => {
      req.cookies.token = "fake.jwt.token";
      redis.set.mockResolvedValue("OK");

      await logoutUser(req, res, next);

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringContaining("blacklist"),
        "true",
        "EX",
        24 * 60 * 60
      );

      expect(res.cookie).toHaveBeenCalledWith(
        "token",
        "",
        expect.objectContaining({
          httpOnly: true,
          expires: expect.any(Date),
        })
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it("should logout even without token", async () => {
      req.cookies = {};

      await logoutUser(req, res, next);

      expect(redis.set).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should call next if redis throws error", async () => {
      req.cookies.token = "jwt";
      redis.set.mockRejectedValue(new Error("Redis down"));

      await logoutUser(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================= CURRENT USER =================
  describe("getCurrentUser", () => {
    it("should return current user", async () => {
      await getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  // ================= USER ADDRESS =================
  describe("getUserAddress", () => {
    it("should return 404 if user not found", async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await getUserAddress(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });

    it("should return user address", async () => {
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ address: [] }),
      });

      await getUserAddress(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("addUserAddress", () => {
    it("should add address successfully", async () => {
      userModel.findOneAndUpdate.mockResolvedValue({
        address: [{ city: "Pune" }],
      });

      await addUserAddress(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 404 if user not found", async () => {
      userModel.findOneAndUpdate.mockResolvedValue(null);

      await addUserAddress(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });

  describe("deleteUserAddress", () => {
    it("should delete address successfully", async () => {
      userModel.updateOne.mockResolvedValue({ modifiedCount: 1 });
      req.params.addressId = "addr1";

      await deleteUserAddress(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 404 if address not found", async () => {
      userModel.updateOne.mockResolvedValue({ modifiedCount: 0 });
      req.params.addressId = "addr1";

      await deleteUserAddress(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    });
  });
});
