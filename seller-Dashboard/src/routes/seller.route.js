const express = require('express');

console.log("Seller routes loaded");

const createAuthMiddleware = require('../middleware/auth.middleware');
const controller = require("../controller/seller.controller")

const router = express.Router();



router.get("/metrics", createAuthMiddleware([ "seller" ]),controller.getMetrics)

router.get("/orders", createAuthMiddleware([ "seller" ]), controller.getOrders)

router.get("/products", createAuthMiddleware([ "seller" ]), controller.getProducts)


module.exports = router;