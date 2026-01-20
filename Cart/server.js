require("dotenv").config();

const app = require('./src/app')
const connectDb = require("./src/db/db");

connectDb().
then(() => {
  console.log("Database connected successfully");
  app.listen(3002, () => {
    console.log("server running on port 3000");
  });
}).catch((err)=> {
    console.error("Error in fetching Database: ",err)
})