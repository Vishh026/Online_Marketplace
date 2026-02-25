const express = require("express");
const errorHandler = require('./middleware/errorHandler')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const cartRouter = require('./routes/cart.route')


const app = express();

app.use(cors())

app.use(express.json())
app.use(cookieParser())

router.get("/", (req, res) => {
  res.status(200).send("cart service Ruunning...");
});

app.use('/api/cart',cartRouter)

app.use(errorHandler)



module.exports = app;