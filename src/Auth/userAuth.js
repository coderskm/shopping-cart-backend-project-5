const jwt =require("jsonwebtoken");
const bookModel = require("../model/bookModel");
const ObjectId = require('mongoose').Types.ObjectId
const authentication = async function (req, res, next) {

    try {
    // check if token key is present in the header/cookies
    let token = req.headers["x-api-key"];
    if(!token){
    return res.status(400).send({ status: false, msg: "Token is Missing" });
    }
        
    // Checking if the token is creted using the secret key provided and decode it.
    let decodedToken = jwt.verify(token, "group62-radon");

    if (!decodedToken)
    return res.status(401).send({ status: false, msg: "Authentication Missing. Login is required. Token is invalid" }); 
    next()
        
    }catch (err) {
        res.status(500).send({ msg: "Serverside Errors. Please try again later", error: err.message })
    }

    }

const authorisation = async function (req, res, next) {

    try {

    let token = req.headers["x-api-key"];
    if(!token){
    return res.status(400).send({ status: false, msg: "Token is Missing" });
    }
    let decodedToken = jwt.verify(token, "group62-radon");
    if (!decodedToken) return res.status(401).send({ status: false, msg: "Authentication Missing. Login is required. Token is invalid" }); 

    
          
    if (decodedToken.userId != (req.params.userId)) {
    return res.status(400).send({ status: false, msg: "token userid and req.body id is not matched" })
    }
    return next()
        
    }catch (err) {res.status(500).send({ msg: "Serverside Errors. Please try again later", error: err.message })
    }

}





module.exports.authentication = authentication
module.exports.authorisation = authorisation