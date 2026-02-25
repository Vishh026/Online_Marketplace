const QUEUES = require("../constants/queues")
const { subscribeToQueue } = require("./broker")
const userModel = require('../model/user.model')
const productModel = require("../model/product.model")
const orderModel = require("../model/order.model")
const paymentModel = require("../model/payment.model")

module.exports = async function initSubscriber(){
    subscribeToQueue(QUEUES.SELLER_AUTH_REGISTER,async(user)=> {
        await userModel.create(user)
    }),
    subscribeToQueue(QUEUES.SELLER_DASHBOARD_PRODUCT_CREATED ,async(product)=> {
        await productModel.create(product)
    }),
    subscribeToQueue(QUEUES.SELLER_ORDER_CREATED ,async(order)=> {
        await orderModel.create(order)
    }),
    subscribeToQueue(QUEUES.SELLER_PAYMENT_INITIATED ,async(order)=> {
        await paymentModel.create(order)
    })
    
}