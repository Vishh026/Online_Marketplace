const jwt = require("jsonwebtoken");
const userModel = require("../model/user.model");
const ApiError = require("../Utilities/ApiError");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next(new ApiError(401, "Not authenticated"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new ApiError(401, "Session expired. Please login again"));
    }
    const user = await userModel.findById(decoded._id);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware crash:", error);
    next(error)
  }
};

module.exports = { authMiddleware };
