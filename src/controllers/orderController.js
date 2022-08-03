const cartModel = require('../models/cartModel');
const { isValidBody, isValid, isValidPassword } = require('../validators/validator');
const { default: mongoose } = require('mongoose');
const productModel = require('../models/productModel');
const userModel=require('../models/userModel')
const orderModel=require('../models/orderModel');

const placeOrder=async function(req,res){
    try{
       let userId=req.params.userId;
       let  {cartId,cancellable ,status,items:[productId,quantity]} = data
       const cartCheck=await cartModel.findOne({userId})
       if(!cartCheck){res.status(404).send({status:false,message:"No cart found for this user"})}

       const productCheck=await productModel.findOne({productId});
       if(!productCheck){res.status(404).send({status:false,message:"No such product"})}

       const userCheck=await userModel.find({userId});
       if(!userCheck){return res.status(404).send({status:false,message:"No such user exists"})}

conosle.log(cartCheck)

       const orderData=await orderModel.create(data)
       return res.status(201).send({status:true,message:"order placed successfully"})

    }catch(err){res.status(500).send({status:false,message:err.message})}
}
module.exports={placeOrder}
