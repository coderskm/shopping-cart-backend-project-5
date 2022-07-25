// usercontroller
const userModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {isValidBody} = require('../validators/validator')


const registerUser = async(req, res) =>{
    try {
        const userData = req.body;
        if (!isValidBody(userData)) {
            return res.status(400).send({status:false, message:"User Data not entered." })
        }
    } catch (err) {
        
    }
}