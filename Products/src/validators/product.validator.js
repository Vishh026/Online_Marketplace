const { body, validationResult } = require("express-validator");
const ApiError = require('../Utilities/ApiError')
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ message: "Validation error", errors: errors.array() });
  }
  next();
}

const createProductValidators = [
  body("title")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ max: 100 })
    .withMessage("title must be under 100 characters"),
  body("description")
    .optional()
    .isString()
    .withMessage("description must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("description max length is 500 characters"),
  body("priceAmount")
    .notEmpty()
    .withMessage("priceAmount is required")
    .bail()
    .isFloat({ gt: 0 })
    .withMessage("priceAmount must be a number > 0"),
  body("priceCurrency")
    .optional()
    .isIn(["USD", "INR"])
    .withMessage("priceCurrency must be USD or INR"),

  (req, res, next) => {
    const files = req.files || [];

    if (files.length > 3) {
      return next(new ApiError(400, "Maximum 3 images are allowed"));
    }

    for (const file of files) {
      // if (!file.mimeType.startsWith("image/")) {
      //   return next(new ApiError(400, "Only image files are allowed"));
      // }

      if (file.size > 2 * 1024 * 1024) {
        return next(new ApiError(400, "Maximum 3 images are allowed"));
      }
    }
    next();
  },
  handleValidationErrors,
];

module.exports = { createProductValidators };
