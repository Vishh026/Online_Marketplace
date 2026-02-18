const express = require("express");
const errorHandler = require('./middlewares/errorHandler')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const orderRoute = require('./routes/order.route')


const app = express();

app.use(cors())

app.use(express.json())
app.use(cookieParser())



app.use('/api/order',orderRoute)

app.use(errorHandler)



module.exports = app;