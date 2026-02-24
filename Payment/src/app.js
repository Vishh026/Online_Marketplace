const express = require("express");
const errorHandler = require('./middleware/errorHandler')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const paymentRouter = require('./routes/payment.route')


const app = express();

app.use(cors())

app.use(express.json())
app.use(cookieParser())



app.use('/api/payment',paymentRouter)

app.use(errorHandler)



module.exports = app;