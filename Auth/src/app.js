const express = require("express");
const authRouter = require('./routes/auth.route')
const userRouter = require('./routes/user.route')

const cors = require('cors')
const cookieParser = require('cookie-parser');
const errorHandler = require("./middlewares/errorHandler.middleware");


const app = express();

app.use(cors())

app.use(express.json())
app.use(cookieParser())

router.get("/", (req, res) => {
  res.status(200).send("Auth service Ruunning...");
});

app.use('/api/auth',authRouter)
app.use('/api/user',userRouter)


app.use(errorHandler)



module.exports = app;
