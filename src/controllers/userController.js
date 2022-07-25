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

const login = async(req, res) =>{
    try {
        const userData = req.body;
        if (!isValidBody(userData)) return res.status(400).send({status:false, message:"User Data not Entered." })

        if(!userData.email) return res.status(400).send({status:false, message:"Please Enter EmailID" })

        if(!userData.password) return res.status(400).send({status:false, message:"Please Enter Password" })

        if(!isValidEmail(userData.email)) return res.status(400).send({status:false, message:"Please enter valid email" })

        const userDetail = await userModel.fineOne({email:userData.email});

        if(!userDetail) return res.status(404).send({status:false, message:"User not Register" });

        const matchPassword = await bcrypt.compare(userData.password,userDetail.password);

        if(!matchPassword) return res.status(401).send({status:false, message:"Invalid credentials" });

        const token = jwt.sign({_id:userDetail._id},"productmanagementgroup62",{expiresIn:"7d"});

        return res.status(200).send({status:true,message:"login succesfull",data:{userId:userDetail._id,token}})

    } catch (err) { return res.status(500).send({status:false,message:err.message})}
}




module.exports = {registerUser,login}