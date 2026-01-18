const {Redis} = require('ioredis')

const redis = new Redis({
    port:process.env.REDIS_PORT,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD
})

redis.on("connect",()=> {
    console.log("redis connected!")
})

module.exports = redis

