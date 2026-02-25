const express = require("express");
const sellerRoutes = require('./routes/seller.route')

const cors = require('cors')
const cookieParser = require('cookie-parser');
const errorHandler = require("./middleware/errorHandler.middleware");

const app = express();

app.use(cors())

app.use(express.json())
app.use(cookieParser())

router.get("/", (req, res) => {
  res.status(200).send("seller service Ruunning...");
});
app.use("/api/seller/dashboard", sellerRoutes);

app.use(errorHandler)

module.exports = app;
