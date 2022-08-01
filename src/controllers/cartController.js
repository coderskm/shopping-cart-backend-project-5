const cartModel = require('../models/cartModel');


const { isValidBody, isValid, isValidPassword, isValidFiles } = require('../validators/validator');
const { default: mongoose } = require('mongoose');
const productModel = require('../models/productModel');
const userModel=require('../models/userModel')
const cartCreation= async function(req,res){
    try{
        let userId = req.params.userId;
        let cartId = req.body.cartId;
        let productId = req.body.productId;

        if(!productId) return res.status(400).send({status:false, message: " Plsase Enter productId  "}); 

        if(!mongoose.isValidObjectId(userId)) return res.status(400).send({status:false, message: " Invalid userId format"});

        if(!mongoose.isValidObjectId(productId)) return res.status(400).send({status:false, message: " Invalid productId format"})

        let quantity = req.body.quantity || 1;
      
        const userCheck=await userModel.find({userId});

        if(!userCheck){return res.status(404).send({status:false,message:"No such user exists"})}

        const cartCheck=await cartModel.findOne({userId});
        console.log(cartCheck)
        const productCheck=await productModel.findOne({_id:productId, isDeleted:false})  
        console.log(productCheck)
        if(!productCheck){return res.status(404).send({status:false,message:"the product doesnt exist or is deleted"})}
        
        if(!cartCheck){
        let cartItems={}
        cartItems.userId=userId
        cartItems.items={productId,quantity}
        cartItems.totalPrice= productCheck.price*quantity;
        cartItems.totalItems=1
        const newCart=await cartModel.create(cartItems)
        return res.status(201).send({status:true,data:newCart})
        }

        const getCart = await cartModel.findById(cartId);
        let isAvilableProduct = getCart.items.some(ele => ele.productId == productId);

        if(isAvilableProduct){
        const oldCart=await cartModel.findOneAndUpdate({_id:cartId,"items.productId":productId},{$inc:{totalPrice:+productCheck.price,"items.$.quantity": +1,}},{new:true})
        //   const oldCart = await cartModel.updateOne({_id:cartId ,items:{$elemMatch:{productId}} },
        //     {$set:{"items.$":{quantity:quantity} ,totalPrice:getCart.totalPrice + productCheck.price*quantity, totalItems: getCart.items.length+1  }},{new:true})

          
        return res.status(201).send({status:true, data:oldCart})
        }
        
        // totalPrice:getCart.totalPrice + productCheck.price*quantity
        // const SameProduct=await cartModel.findOneAndUpdate({_id:cartId,productId},{},{new:true})

        // if(cartCheck && cartId  )return res.status(400).send({status:false, message: "Enter your cart ID "})

        if(!mongoose.isValidObjectId(cartId)) return res.status(400).send({status:false, message: " Invalid cartId format"})

        const oldCart=await cartModel.findOneAndUpdate({_id:cartId},{$push:{items:{productId,quantity}},totalPrice:cartCheck.totalPrice+productCheck.price*quantity,totalItems:cartCheck.items.length+1},{new:true})
        return res.status(201).send({status:true, data:oldCart})
        
    }catch(err){
    return res.status(500).send({status: false, message: err.message })}
}

const getCart=async function(req,res){
    try{
        let userId=req.params.userId;
        if(!mongoose.isValidObjectId(userId)) return res.status(400).send({status:false, message: " Invalid userId format"})

        const userCheck=await userModel.find({userId})
        if(!userCheck){return res.status(404).send({status:false,message:"User not found"})}

        const cartCheck=await cartModel.findOne({userId})
        if(!cartCheck){return res.status(404).send({status:false,message:"No cart found for this user"})}

        return res.status(200).send({status:true,data:cartCheck})
    }catch(err){
        return res.status(500).send({status: false, message: err.message })}
}

module.exports={cartCreation,getCart}