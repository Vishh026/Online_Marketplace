const express = require('express')
const authController = require('../controllers/auth.controller')
const validator = require('../middlewares/validators.middleware')

const router = express.Router()

router.post('/register',validator.registerUserValidations,authController.registerUser)
router.post('/login',validator.loginUserValidations,authController.loginUser)
router.post('/logout',authController.logoutUser)



module.exports = router