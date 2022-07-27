// usercontroller
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { isValidBody, isValid, isValidPassword, isValidFiles } = require('../validators/validator');
const {uploadFile} = require('../aws/upload');
const { default: mongoose } = require('mongoose');

const registerUser = async(req, res) =>{
    try {
        const userData = req.body;
        const file = req.files;
        let nameRegex = /^[a-zA-Z ]{2,20}$/;
        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
        let phoneRegex = /^[6-9]\d{9}$/;
        let streetRegex = /^([a-zA-Z0-9 ]{5,20})*$/;
        let cityRegex = /^[a-zA-z]+([\s][a-zA-Z]+)*$/;
        let pinRegex = /^[1-9]\d{5}$/;
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
             
        if (!isValid(phone) && !phone.match(phoneRegex)) {
            return res.status(400).send({status: false, message: "Phone number of user not present or not legit. Shold contain only digits"})
        }
        let uniquePhone = await userModel.findOne({ phone: phone });
        if (uniquePhone) {
            return res.status(400).send({status:false, message:"Phone number already in use. Please try another"})
        }
        if (!isValid(password)) {
            return res.status(400).send({status: false, message: "password of user not present."})
        }
        if(!isValidPassword(password)) {
            return res.status(400).send({status: false, message: "password of user not legit. Should be between 8 to 15 characters"})
        }
        let saltrounds = 10;
        const passwordHash = await bcrypt.hash(password, saltrounds)
        if (!isValid(address)) {
            return res.status(400).send({status:false, message:"address of user not present."})
        }
        const profileImage = await uploadFile(file[0]);
        if (!isValidFiles(file)) {
           return res.status(400).send({status:false, message:"user profile image required"})
       } 

        let str = JSON.parse(JSON.stringify(address))
        console.log(str);
        let addObj = JSON.parse(str)
        console.log(addObj)

        if (typeof addObj == 'object' && Object.keys(addObj).length===2) {
            if (typeof addObj.shipping == 'object' && Object.keys(addObj.shipping).length === 3) {
                if (!isValid(addObj.shipping.street)) {
                    return res.status(400).send({status:false, message:"shipping's street name is required"})
                }
                if(!(streetRegex).test(addObj.shipping.street)) {
                    return res.status(400).send({status:false, message:"shipping's street name should contain alphanumeric values"})
                }
                if (!isValid(addObj.shipping.city)) {
                    return res.status(400).send({status:false, message:"shipping's city name required."})
                }
                if(!(cityRegex).test(addObj.shipping.city)) {
                    return res.status(400).send({status:false, message:"shipping's city name should contain only alphabets"})
                }
                if (typeof addObj.shipping.pincode!=='number') {
                    return res.status(400).send({status:false, message:"shipping's pincode should be a number."})
                }
                if(!(pinRegex).test(addObj.shipping.pincode)) {
                    return res.status(400).send({status:false, message:"shipping's pincode should contain 6 digits."})
                }
            }
            if (typeof addObj.billing == 'object' && Object.keys(addObj.billing).length === 3) {
                if (!isValid(addObj.billing.street)) {
                    return res.status(400).send({status:false, message:"billing's street name is required"})
                }
                if(!(streetRegex).test(addObj.billing.street)) {
                    return res.status(400).send({status:false, message:"billing's street name should contain alphanumeric values"})
                }
                if (!isValid(addObj.billing.city)) {
                    return res.status(400).send({status:false, message:"billing's city name is required"})
                }
                if(!(cityRegex).test(addObj.billing.city)) {
                    return res.status(400).send({status:false, message:"billing's city name should contain only alphabets"})
                }
                if (typeof addObj.billing.pincode!=='number') {
                    return res.status(400).send({status:false, message:"billing's pincode should be a number."})
                }
                if (!(pinRegex).test(addObj.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "billing's pincode should contain 6 digits." })
                    }
                }
                
            }
        
        
        const user ={fname:fname,lname:lname,email:email,phone:phone, profileImage:profileImage, password:passwordHash, address:addObj}
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


const getUserById= async function(req,res){
    try{
    userId=req.params.userId;
    if(userId!==req.userDetails._id){res.status(403).send({status:false,message:"unauthorised user"})}
    if(!userId){res.status(400).send({status:false,message:"please enter user id in params"})}
    if(!mongoose.isValidObjectId(userId)){res.status(400).send({status:false,message:"please enter a valid user id"})}
    const findUser=await userModel.findById(userId)
    if(!findUser){return res.status(404).send({status:false,message:"no such user found in the database"})}

     return res.status(200).send({status:true,data:findUser})
     }catch(err){return res.status(500).send({status:false,message:err.message})}
}



module.exports = {registerUser,login, getUserById}
