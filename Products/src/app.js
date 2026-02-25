const express = require("express");
const errorHandler = require('./middlewares/errorHandler')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const productRouter = require('./routes/product.route')


const app = express();

app.use(cors())

app.use(express.json())
app.use(cookieParser())

router.get("/", (req, res) => {
  res.status(200).send("Products service Ruunning...");
});


app.use('/api/products',productRouter)

app.use(errorHandler)



module.exports = app;