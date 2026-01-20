const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({

},{ timestamps: true },
);


const cartModel = mongoose.model("cart", cartSchema);

module.exports = cartModel;