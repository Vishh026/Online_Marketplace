require('dotenv').config()
const app = require('./src/app')

app.listen(3007,()=> {
    console.log("Notification service running on port 3007")
})
