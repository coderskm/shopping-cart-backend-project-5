const express = require('express');
const auth= require('../Auth/userAuth');
const router = express.Router();
const controllers=require("../controllers/userController")

router.post("/register",  controllers.registerUser)
router.post("//login",  auth.authentication,controllers.getProducts)
router.get("/user/:userId/profile",  auth.authentication,auth.authorisation,controllers.getProducts)
module.exports=router;