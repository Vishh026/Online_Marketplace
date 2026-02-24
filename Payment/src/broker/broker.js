const amqblib = require("amqplib");

let channel, connection;

const connect = async () => {
  try {
    if (connection) return connection;
    connection = await amqblib.connect(process.env.RABBIT_URL);
    channel = await connection.createChannel();
    console.log("RabbitMQ connected!");

    connection.on("close", () => {
      console.error("RabbitMQ closed. Reconnecting...");
      setTimeout(connect, 5000);
    });
  } catch (error) {
        console.error("RabbitMQ connection error:", error);
        setTimeout(connect, 5000);
    }
};

async function publishToQueue(queueName, data = {}) {
  if (!connection || !channel) await connect();

  await channel.assertQueue(queueName, {
    durable: true,
  });
  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
    persistent: true,
  });
  console.log("sendqueue: ", queueName, data);
}

async function subscribeToQueue(queueName, callback) {
  if (!connection || !channel) await connect();
  
   await channel.assertQueue(queueName, {
    durable: true,
  });

  channel.consume(queueName, async (msg) => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());
      console.log("data: ", data);
      try {
        await callback(data);
        channel.ack(msg);
      } catch (err) {
        console.error("Processing failed", err);
        channel.nack(msg, false, true); // requeue
      }
    }
  });
}

module.exports = {
  channel,
  connection,
  connect,
  publishToQueue,
  subscribeToQueue,
};
