require("dotenv").config();
const app = require('./src/app');
const { connect } = require("./src/broker/broker");
const connectDb = require("./src/db/db");
const initSubscriber = require('./src/broker/listener')
async function startServer (){
  try{
     await connectDb();
    console.log("Database connected successfully");

    await connect(); // RabbitMQ

    await initSubscriber()
    app.listen(3008, () => {
      console.log("Server running on port 3008");
    });
  }catch(err){
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

startServer()




