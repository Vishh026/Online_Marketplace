const axios = require('axios')

const fetchOrder = async(orderId,token) => {
    const {data} = await axios.get('http://localhost:3004/api/order/me/'+ orderId,{
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    return data
}

module.exports = { 
    fetchOrder
}