// usercontroller
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const { isValidBody, isValid, isValidPassword, isValidFiles } = require('../validators/validator');
const {uploadFile} = require('../aws/upload');
const { default: mongoose } = require('mongoose');

let nameRegex = /^[a-zA-Z ]{2,20}$/;
let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
let phoneRegex = /^[6-9]\d{9}$/;
let streetRegex = /^([a-zA-Z0-9.\-_ ]{5,20})*$/;
let cityRegex = /^[a-zA-z]+([\s][a-zA-Z]+)*$/;
let pinRegex = /^[1-9]\d{5}$/;

const registerUser = async(req, res) =>{ 
    try {
        const userData = req.body;
        const file = req.files;
      
        if (!isValidBody(userData)) {
            return res.status(400).send({ status: false, message: "User Data not entered." });
        }
        const { fname, lname, email, phone, password, address } = userData;
        
        if (!isValid(fname)) {
           return res.status(400).send({ status: false, message: "First Name of user not present" });

        }
        if (!nameRegex.test(fname)) {
            return res.status(400).send({status:false, message:"First name should contain only alphabets."})
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "Last Name of user not present" });
        }
        if (!nameRegex.test(lname)) {
            return res.status(400).send({status:false, message:"last name should contain only alphabets."})
        }
        if (!isValid(email)) {
            return res.status(400).send({status: false, message: "Email of user not present"})
        }
        if (!emailRegex.test(email)) {
            return res.status(400).send({status:false, message:"email not legit. Please try another"})
        }
        let uniqueEmail = await userModel.findOne({ email: email });
        if (uniqueEmail) {
            return res.status(400).send({status:false, message:"email already in use. Please try another"})
        }
             
        if (!isValid(phone)) {
            return res.status(400).send({status: false, message: "Phone number of user not present."})
        }
        if (!phoneRegex.test(phone)) {
            return res.status(400).send({status:false, message:"Phone number should be of 10 digits.Indian number start with 6,7,8 or 9."})
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
        const passwordHash = await bcrypt.hash(password, 10) // bcrypt.hash(password, saltrounds)
        if (!isValid(address)) {
            return res.status(400).send({status:false, message:"address of user not present."})
        }
        if (!isValidFiles(file)) {
           return res.status(400).send({status:false, message:"user profile image required"})
       } 

       // let str = JSON.parse(JSON.stringify(address))
        //console.log(str)
        let addObj = JSON.parse(address)
        //console.log(addObj)

        if (typeof addObj == 'object' && Object.keys(addObj).length===2) {
            if (typeof addObj.shipping == 'object' && Object.keys(addObj.shipping).length === 3) {
                if (!isValid(addObj.shipping.street)) {
                    return res.status(400).send({status:false, message:"shipping's street name is required"})
                }
                if(!(streetRegex).test(addObj.shipping.street)) {
                    return res.status(400).send({status:false, message:"shipping's street name should contain alphanumeric values, ., -, and _"})
                }
                if (!isValid(addObj.shipping.city)) {
                    return res.status(400).send({status:false, message:"shipping's city name required."})
                }
                if(!(cityRegex).test(addObj.shipping.city)) {
                    return res.status(400).send({status:false, message:"shipping's city name should contain only alphabets"})
                }
                if (!isValid(addObj.shipping.pincode)) {
                    return res.status(400).send({status:false, message:"shipping's pincode is required."})
                }
                if(!(pinRegex).test(addObj.shipping.pincode)) {
                    return res.status(400).send({status:false, message:"shipping's pincode should contain 6 digits and first digit should not be 0."})
                }
            } else {
                return res.status(400).send({status:false, message:"missing street, city or pincode any of three for shipping address"})
            }
            if (typeof addObj.billing == 'object' && Object.keys(addObj.billing).length === 3) {
                if (!isValid(addObj.billing.street)) {
                    return res.status(400).send({status:false, message:"billing's street name is required"})
                }
                if(!(streetRegex).test(addObj.billing.street)) {
                    return res.status(400).send({status:false, message:"billing's street name should contain alphanumeric values, ., -, and _"})
                }
                if (!isValid(addObj.billing.city)) {
                    return res.status(400).send({status:false, message:"billing's city name is required"})
                }
                if(!(cityRegex).test(addObj.billing.city)) {
                    return res.status(400).send({status:false, message:"billing's city name should contain only alphabets"})
                }
                if (!isValid(addObj.shipping.pincode)) {
                    return res.status(400).send({status:false, message:"billing's pincode is required."})
                }
                if (!(pinRegex).test(addObj.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "billing's pincode should contain 6 digits and first digit should not be 0." })
                    }
                }else {
                return res.status(400).send({status:false, message:"missing street, city or pincode any of three for billing address"})
            }
                
        } else {
            return res.status(400).send({status:false, message:"address is missing shipping detail or billing detail or both"})
            }
        
        const profileImage = await uploadFile(file[0]);
        
        const user ={fname:fname,lname:lname,email:email,phone:phone,profileImage:profileImage, password:passwordHash, address:addObj}
        const userCreated = await userModel.create(user);
        res.status(201).send({status:true, message:"User Created Successfully", data: userCreated })
    } catch (err) {
        if (err.message == "Unexpected number in JSON at position 65") {
            return res.status(400).send({status:false, message:"pin code cannot start with 0"})
        }
        if (err.message == "Unexpected number in JSON at position 130") {
            return res.status(400).send({status:false, message:"pin code cannot start with 0"})
        }
        if (err.message == "Unexpected token } in JSON at position 65") {
            return res.status(400).send({status:false, message:"pin code should not be empty"})

        }
        if (err.message == "Unexpected token } in JSON at position 132") {
            return res.status(400).send({status:false, message:"pin code should not be empty"})

        }
        return  res.status(500).send({ status: false, message: err.message });
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

const getProfile= async function(req,res){
    try{
        let userId = req.params.userId; 

        if(!mongoose.isValidObjectId(userId)){res.status(400).send({status:false,message:"please enter a valid user id"})}

        if(userId !== req.userDetails._id){return res.status(403).send({status:false,message:"unauthorised user"})}

        if(!userId){return res.status(400).send({status:false,message:"please enter user id in params"})}


        const findUser=await userModel.findById(userId);

        if(!findUser){return res.status(404).send({status:false,message:"no such user found in the database"})}

        return res.status(200).send({status:true,data:findUser});

    }catch(err){return res.status(500).send({status:false,message:err.message})}
}

let updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        let userData = req.body
        const file = req.files;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: " Invalid userId format" })
        }

        let checkUser = await userModel.findById(userId);

        if (!checkUser) return res.status(404).send({ status: false, message: "userId not found" })

        if (!isValidBody(userData)) {
            return res.status(400).send({ status: false, message: "Please Provide data for updation" })
        }
        
        if (userData.fname || typeof userData.fname == 'string') {
            if (!isValid(userData.fname)) {
                return res.status(400).send({ status: false, message: "firstname required" })
            }
            if (!nameRegex.test(userData.fname)) return res.status(400).send({ status: false, message: "Opps! fname is not a valid name" })
            
            checkUser.fname = userData.fname
        }

        if (userData.lname || typeof userData.lname == 'string') {
            if (!isValid(userData.lname)) {
                return res.status(400).send({ status: false, message: "lastname required" })
            }
            if (!nameRegex.test(userData.lname)) return res.status(400).send({ status: false, message: "Opps! lname is not a valid name" })
            checkUser.lname = userData.lname
        }

        if (userData.email || typeof userData.email == 'string') {
            if (!isValid(userData.email)) {
                return res.status(400).send({ status: false, message: "email required" })
            }
            if (!emailRegex.test(userData.email)) return res.status(400).send({ status: false, message: "Opps! email is not a valid name" })
            let uniqueEmail = await userModel.findOne({ email: userData.email });
            if (uniqueEmail) return res.status(400).send({ status: false, message: "Opps! email is already  present in our database" })
            checkUser.email = userData.email
        }

        if (userData.phone || typeof userData.phone == 'string') {
            if (!isValid(userData.phone)) {
                return res.status(400).send({ status: false, message: "phone number required" })
            }
            if (!phoneRegex.test(userData.phone))
                return res.status(400).send({ status: false, message: "Opps! phone is not valid. Should have 10 digits" })
            let uniquePhone = await userModel.findOne({ phone: userData.phone })
            if (uniquePhone) return res.status(400).send({ status: false, message: "phone already exist" })
            checkUser.phone = userData.phone
        
        }

        if (userData.password || typeof userData.password == 'string') {
            if (!isValid(userData.password)) return res.status(400).send({ status: false, message: "password of user not present." })
            if (!isValidPassword(userData.password)) {
                return res.status(400).send({ status: false, message: "password of user not legit. Should be between 8 to 15 characters" })
            }
            checkUser.password = await bcrypt.hash(userData.password, 10)
        }
        if (userData.profileImage) {
            if (!isValidFiles(file)) return res.status(400).send({ status: false, message: "user profile image required" })
            let profileImage = await uploadFile(file[0]);
            checkUser.profileImage = profileImage;
        }


        if (userData.address) {
            userData.address = JSON.parse(userData.address);

            if (userData.address.shipping) {
                if (userData.address.shipping.street || typeof userData.address.shipping.street == 'string') {
                    if (!isValid(userData.address.shipping.street)) {
                        return res.status(400).send({ status: false, message: "shipping's street name is required" })
                    }
                    if (!streetRegex.test(userData.address.shipping.street)) return res.status(400).send({ status: false, message: "shipping's street name is contain alphanumeric values, ., -, and _ " })
                    checkUser.address.shipping.street = userData.address.shipping.street
                }
                if (userData.address.shipping.city || typeof userData.address.shipping.city == 'string') {
                    if (!isValid(userData.address.shipping.city)) {
                        return res.status(400).send({ status: false, message: "shipping's city name is required" })
                    }
                    if (!cityRegex.test(userData.address.shipping.city)) return res.status(400).send({ status: false, message: "shipping's city name contain alphabet only " })
                    checkUser.address.shipping.city = userData.address.shipping.city
                }
                if (userData.address.shipping.pincode || typeof userData.address.shipping.pincode == 'string') {
                    if (!isValid(userData.address.shipping.pincode)) {
                        return res.status(400).send({ status: false, message: "shipping's pincode is required" })
                    }
                    if (!pinRegex.test(userData.address.shipping.pincode)) return res.status(400).send({ status: false, message: "shipping's pincode is required and only 6 digit in number and makesure not start with 0 " })
                    checkUser.address.shipping.pincode = userData.address.shipping.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: "shipping address missing" })
            }
            if (userData.address.billing) {
                if (userData.address.billing.street || typeof userData.address.billing.street == 'string') {
                    if (!isValid(userData.address.billing.street)) {
                        return res.status(400).send({ status: false, message: "billing's street name is required" })
                    }
                    if (!streetRegex.test(userData.address.billing.street)) return res.status(400).send({ status: false, message: "billing street name is required and contain alphanumeric values, ., -, and _ " })
                    checkUser.address.billing.street = userData.address.billing.street
                }
                if (userData.address.billing.city || typeof userData.address.billing.city == 'string') {
                    if (!isValid(userData.address.billing.city)) {
                        return res.status(400).send({ status: false, message: "billing's city name is required" })
                    }
                    if (!cityRegex.test(userData.address.billing.city)) return res.status(400).send({ status: false, message: "billing city name contain alphabets only" })
                    checkUser.address.billing.city = userData.address.billing.city
                }
                if (userData.address.billing.pincode || typeof userData.address.billing.pincode == 'string') {
                    if (!isValid(userData.address.billing.pincode)) {
                        return res.status(400).send({ status: false, message: "billing's pincode is required" })
                    } {
                        if (!pinRegex.test(userData.address.billing.pincode)) return res.status(400).send({ status: false, message: "billing pincode  is required and only 6 digit in number and makesure not start with 0" })
                        checkUser.address.billing.pincode = userData.address.billing.pincode
                    }
                } else {
                    return res.status(400).send({ status: false, message: "billing address missing" })
                }
            } else {
                return res.status(400).send({ status: false, message: "address is required having both shipping and billing addresses" })
            }
            const data = await checkUser.save();
            return res.status(200).send({ status: true, message: "User profile updated", data })
        }
}catch (err) { return res.status(500).send({ status: false, message: err.message }) }
    
    }


module.exports = {registerUser,login, getProfile,updateUser}
