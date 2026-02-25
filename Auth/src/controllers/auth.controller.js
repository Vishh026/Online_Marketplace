const userModel = require("../model/user.model");
const ApiError = require("../Utilities/ApiError");
const ApiResponse = require("../Utilities/ApiResponse");
const redis = require("../db/redis");
const { publishToQueue } = require("../broker/broker");
const QUEUES = require("../constants/queues");

async function registerUser(req, res, next) {
  try {
    const {
      name: { firstName, lastName },
      username,
      email,
      password,
      role,
    } = req.body;

    const userAlreadyExists = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (userAlreadyExists) {
      return next(new ApiError(409, "username or email already exists"));
    }

    const user = await userModel.create({
      name: { firstName, lastName },
      username,
      email,
      password,
      role: role || "user",
    });

    const token = user.getJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    await Promise.all([
      publishToQueue(QUEUES.USER_REGISTERED, {
      eventType: "USER_REGISTERED",
      timestamp: new Date().toISOString(),
      data: {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    }),
      publishToQueue(QUEUES.SELLER_AUTH_REGISTER,user)
    ])

    return res.status(201).json(
      new ApiResponse(201, "User registered successfully", {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const user = await userModel
      .findOne({ $or: [{ email }, { username }] })
      .select("+password");

    if (!user) {
      return next(new ApiError(401, "Invalid credentials"));
    }

    const isPasswordValid = user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ApiError(401, "Invalid credentials"));
    }

    const token = user.getJWT();

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    await publishToQueue(QUEUES.USER_LOGIN, {
      eventType: "USER_LOGIN",
      timestamp: new Date().toISOString(),
      data: {
        userId: user._id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    return res.status(200).json(
      new ApiResponse(200, "User logged in successfully", {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        address: user.address,
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function logoutUser(req, res, next) {
  try {
    const token = req.cookies.token;

    if (token) {
      // Blacklisting(redis) whole jwt is wrong -> only blacklist the jti
      const black = await redis.set(
        `blacklist : ${token}`,
        `true`,
        `EX`,
        24 * 60 * 60,
      );
    }

    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
    });

    return res
      .status(200)
      .json(new ApiResponse(200, "User logged out successfully"));
  } catch (error) {
    next(error);
  }
}

async function getCurrentUser(req, res, next) {
  try {
    return res.status(200).json(
      new ApiResponse(200, "User fetched successfully", {
        user: req.user,
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function getUserAddress(req, res, next) {
  try {
    const user = await userModel.findById(req.user._id).select("address");

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    return res.status(200).json(
      new ApiResponse(200, "User address fetched successfully", {
        address: user.address,
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function addUserAddress(req, res, next) {
  try {
    const { street, city, state, country, pincode, isDefault } = req.body;

    const user = await userModel.findOneAndUpdate(
      { _id: req.user._id },
      {
        $push: {
          address: {
            street,
            city,
            state,
            country,
            pincode,
            isDefault,
          },
        },
      },
      { new: true },
    );

    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    return res.status(200).json(
      new ApiResponse(200, "Address added successfully", {
        address: user.address,
      }),
    );
  } catch (error) {
    next(error);
  }
}

async function deleteUserAddress(req, res, next) {
  try {
    const { addressId } = req.params;

    const result = await userModel.updateOne(
      { _id: req.user._id, "address._id": addressId },
      { $pull: { address: { _id: addressId } } },
    );

    if (result.modifiedCount === 0) {
      return next(new ApiError(404, "Address not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, "Address deleted successfully"));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getUserAddress,
  addUserAddress,
  deleteUserAddress,
};
