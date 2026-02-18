const jwt = require('jsonwebtoken')
const ApiError = require("../Utilities/ApiError")

function createAuthMiddleware(roles = ["user"]) {
  return function authMiddleware(req, res, next) {
    try {
      const token =
        req.cookies?.token || req.headers?.authorization?.split(" ")[1];

      if (!token) {
        throw new ApiError(401, "Unauthorized: No token provided");
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if(!roles.includes(decoded.role)){
        throw new ApiError(403, "Forbidden: Insufficient permissions");
      }

      req.user  = decoded

      next()
    } catch (error) {
      next(error);
    }
  };
}




module.exports = createAuthMiddleware;
 