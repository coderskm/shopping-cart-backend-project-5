const cartModel = require('../models/cartModel');
const { isValidBody, isValid, isValidPassword } = require('../validators/validator');
const { default: mongoose } = require('mongoose');
const productModel = require('../models/productModel');
const userModel=require('../models/userModel')
const orderModel=require('../models/orderModel');

const placeOrder=async function(req,res){
    try{
       let userId=req.params.userId;

       
       const userCheck=await userModel.find({userId});
       if(!userCheck){return res.status(404).send({status:false,message:"No such user exists"})}

       let cartId = req.body.cartId
       const cartCheck=await cartModel.findById(cartId)
       if(!cartCheck){res.status(404).send({status:false,message:"No cart found for this user"})}
       if(cartCheck.items.length == 0) {
          return res.status(400).send({status:false, message:"you can't order anything from the cart"})
       }
       let total =0
        cartCheck.items.forEach(ele => total += ele.quantity)
       let CreateOder = {};
       CreateOder.userId = userId;
       CreateOder.totalItems = cartCheck.totalItems;
       CreateOder.totalPrice =  cartCheck.totalPrice;
       CreateOder.items = cartCheck.items
       CreateOder.totalQuantity = total
       CreateOder.status = "pending"

       const orderData=await orderModel.create(CreateOder)
       return res.status(201).send({status:true,message:"order placed successfully" , data: orderData})

    }catch(err){res.status(500).send({status:false,message:err.message})}
}

const updateOrder=async function(req,res){
    try{
       let userId=req.params.userId;
        let {orderId} = req.body
       
       const userCheck=await userModel.findOne({userId});
       if(!userCheck){return res.status(404).send({status:false,message:"No such user exists"})}

       const checkOder=await orderModel.findById(orderId)
       if(!checkOder){return  res.status(404).send({status:false,message:"No Oder found for this user"})}

    //    if(checkOder.cancellable == false) {return res.status(400).send({status:false, message:"this oder can't be cancled"})}
       

       const orderData=await orderModel.findOneAndUpdate(orderId,{ status:"completed"},{new:true})
       return res.status(201).send({status:true,message:"order completed successfully" , data: orderData})

    }catch(err){res.status(500).send({status:false,message:err.message})}
}
module.exports={placeOrder,updateOrder}
