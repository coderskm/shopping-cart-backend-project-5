// usercontroller
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { isValidBody, isValid, isValidPassword, isValidFiles } = require('../validators/validator');
const {uploadFile} = require('../aws/upload')

const registerUser = async(req, res) =>{
    try {
        const userData = req.body;
        const file = req.files;
         let nameRegex = /^[a-zA-Z ]{2,20}$/;
         let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
         let phoneRegex = /^[6-9]\d{9}$/;
        if (!isValidBody(userData)) {
            return res.status(400).send({ status: false, message: "User Data not entered." });
        }
        // profileImage work later
        const { fname, lname, email, phone, password, address } = userData;
        
        if (!isValid(fname) && !fname.match(nameRegex)) {
           return res.status(400).send({ status: false, message: "First Name of user not present or not legit. Should contain only alphabets" });

        }
        if (!isValid(lname)&&!lname.match(nameRegex)) {
            return res.status(400).send({ status: false, message: "Last Name of user not present or not legit. Should contain only alphabets" });
        }
        if (!isValid(email)&&!email.match(emailRegex)) {
            return res.status(400).send({status: false, message: "Email of user not present"})
        }
        let uniqueEmail = await userModel.findOne({ email: email });
        if (uniqueEmail) {
            return res.status(400).send({status:false, message:"email already in use. Please try another"})
        }
        if (!isValidFiles(file)) {
            return res.status(400).send({status:false, message:"user profile image required"})
        }
        const profileImage = await uploadFile(file[0]);
        if (!isValid(phone) && !phone.match(phoneRegex)) {
            return res.status(400).send({status: false, message: "Phone number of user not present or not legit. Shold contain only digits"})
        }
        let uniquePhone = await userModel.findOne({ phone: phone });
        if (uniquePhone) {
            return res.status(400).send({status:false, message:"Phone number already in use. Please try another"})
        }
        if (!isValid(password) && !isValidPassword(password)) {
            return res.status(400).send({status: false, message: "password of user not present or not legit. Should be between 8 to 15 characters"})
        }
        let saltrounds = 10;
        const passwordHash = await bcrypt.hash(password, saltrounds)
        if (!isValid(address) && Object.keys(address).length!=2) {
            return res.status(400).send({ status: false, message: "Address of user not present" });
        }
        if (address) {
            if (Object.keys(address.shipping).length != 3) {
                return res.status(400).send({status:false, message:"shipping address should contain:- street city pincode"})
            }
             if (Object.keys(address.billing).length != 3) {
                return res.status(400).send({status:false, message:"billing address should contain:- street city pincode"})
            }
        }
        const user ={fname:fname,lname:lname,email:email,phone:phone, profileImage:profileImage, password:passwordHash, address:address}
        const userCreated = await userModel.create(user);
        res.status(201).send({status:true, message:"User Created Successfully", data: userCreated })
    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}

const login = async(req, res) =>{
    try {
        const userData = req.body;
        if (!isValidBody(userData)) return res.status(400).send({status:false, message:"User Data not Entered." })

        if(!userData.email) return res.status(400).send({status:false, message:"Please Enter EmailID" })

        if(!userData.password) return res.status(400).send({status:false, message:"Please Enter Password" })

        if(!/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/.test(userData.email)) return res.status(400).send({status:false, message:"Please enter valid email" })

        const userDetail = await userModel.findOne({email:userData.email});

        if(!userDetail) return res.status(404).send({status:false, message:"User not Register" });

        const matchPassword = await bcrypt.compare(userData.password,userDetail.password);

        if(!matchPassword) return res.status(401).send({status:false, message:"Invalid credentials" });

        const token = jwt.sign({_id:userDetail._id},"productmanagementgroup62",{expiresIn:"7d"});

        return res.status(200).send({status:true,message:"login succesfull",data:{userId:userDetail._id,token}})

    } catch (err) { return res.status(500).send({status:false,message:err.message})}
}



module.exports = {registerUser,login}
