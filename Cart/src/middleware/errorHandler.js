const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  console.log("err",errorHandler)
  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;