const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zip: String,
  country: String,
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "seller"],
      default: "user",
    },
    address: [addressSchema],
  },
  { timestamps: true },
)

userSchema.pre("save", async function () {
  try {
    this.password = await bcrypt.hash(this.password, 10);
  } catch (error) {
    console.error(error)
  }
});


userSchema.methods.getJWT = function () {
  return jwt.sign(
    { _id: this._id,role: this.role,username: this.username,email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

userSchema.methods.comparePassword = async function (passwordInputByUser) {
  return bcrypt.compare(passwordInputByUser, this.password);
};


const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
