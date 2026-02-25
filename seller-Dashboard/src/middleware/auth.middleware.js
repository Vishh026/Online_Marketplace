const jwt = require("jsonwebtoken");
const ApiError = require("../Utilities/ApiError");

function CreateAuthMiddleware(roles = ["user"]){
  return (req, res, next) => {
    try {
      const token =
        req.cookies?.token || req.headers?.authorization?.split(" ")[1];

      if (!token) {
        return next(new ApiError(401, "Unauthenticated permission"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!roles.includes(decoded.role)) {
        return next(new ApiError(403, "Forbidden: Insufficient permissions'"));
      }

      if (!decoded) {
        return next(new ApiError(401, "Session expired. Please login again"));
      }

      req.user = decoded;

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = CreateAuthMiddleware;