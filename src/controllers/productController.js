const productModel = require('../models/productModel');
const { default: mongoose, } = require('mongoose');
const { isValidBody, isValid,  isValidFiles } = require('../validators/validator');
const {uploadFile} = require('../aws/upload');

let nameRegex = /^[a-zA-Z ]{2,20}$/;

const newProduct= async function(req,res){
    try{
    let data=req.body;
    let file=req.files;
        
    if (!isValidBody(data)) {
    return res.status(400).send({ status: false, message: "User Data not entered." });
    }
    let {title,description,price,currencyId,currencyFormat,style,availableSizes,installments}=data;
    if (!isValid(title)) {
    return res.status(400).send({ status: false, message: "title is required" });}
    if(!nameRegex.test(title)){
    return res.status(400).send({ status: false, message: "title Should contain only alphabets" });}
    let checkTitle=await productModel.findOne({title})
    if(checkTitle){return res.status(400).send({ status: false, message: "title already exists, should be unique" });}

    if (!isValid(description)) {return res.status(400).send({ status: false, message: "description not valid" });}
        
    if (!isValid(price)) {return res.status(400).send({ status: false, message: "price not valid" });}

    if(typeof Number(price)==NaN) return res.status(400).send({status:false,message:"price should only be in digits"})
    if(!typeof(price)===Number){return res.status(400).send({status:false,message:"price should only be in digits"})}
        
    if (!isValid(currencyId)) {return res.status(400).send({ status: false, message: "currencyId not valid" });}
    if(currencyId!=="INR"){res.status(400).send({ status: false, message: "currencyId should only be INR" })}

    if (!isValid(currencyFormat)) {return res.status(400).send({ status: false, message: "currency Format not valid" });}
    if(currencyFormat!=="₹") {return res.status(400).send({ status: false, message: "only ₹ currency format is acceptable" });}

    if (!isValid(style)) {return res.status(400).send({ status: false, message: "style not valid" });}
    if(!typeof(style)==String){return res.status(400).send({ status: false, message: "style should only be string Type" });}
        
    if(!availableSizes){return res.status(400).send({ status: false, message: "available Sizes is  required" });}
    if(availableSizes){
    availableSizes = availableSizes.split(",");
    let enumValue =  ["S", "XS", "M", "X", "L", "XXL", "XL"]
    const isVAlue =availableSizes.every(ele => enumValue.includes(ele) );
    
    if (!isVAlue) return res.status(400).send({status:false,message:"sizes can only be accepted in S, XS, M,X,L,XXL,XL"})
    }

    if(installments){
    installments = (parseInt(installments))
    if(typeof( installments )!=="number"){res.status(400).send({status:false,message:"installments should only be in digits"})}
    }
    if (!isValidFiles(file)) {
        return res.status(400).send({status:false, message:"product image required"})
        }   

    const productImage = await uploadFile(file[0]);
     
    const product ={title:title,description:description,price:price,currencyId:currencyId,currencyFormat:currencyFormat,productImage:productImage, availableSizes:availableSizes,installments:installments}       
    const productData = await productModel.create(product);
    return res.status(201).send({status:true,message:"Success",data:productData})
    }catch(err){
        return res.status(500).send({ status: false, message: err.message });}
}

const getAllProduct = async (req,res)=>{
try{
    const {size,name,priceGreaterThan,priceLessThan,priceSort,...rest} = req.query
   
    if(Object.keys(rest).length !== 0)  return res.status(400).send({status:false,message:`You can't filter for this key`})

    const priceSorter = (data,priceSort)=> {
        if(priceSort == -1) data.sort((a,b)=> a.price - b.price); // dec
        if(priceSort == 1)  data.sort((a,b)=> b.price - a.price); //
        return data;
    }

    if((Object.keys(req.query).includes("priceSort") && (Object.keys(req.query).length ==1 )) ||( Object.keys(req.query).length == 0 ) ){

        let data = await productModel.find({isDeleted:false});

        if(data.length == 0) return res.status(404).send({status:false,message:" Produts not found",})

         data = priceSorter(data , priceSort);

        return res.status(200).send({status:true,message:"all Produts",data})
    }else{
        let filter ={};
        if(name)  filter.title = {"$regex":name,"$options":'i'}; 
        if(size) filter.availableSizes = {"$in":size};
        if(priceGreaterThan) filter.price = {"$gte":priceGreaterThan};
        if(priceLessThan) filter.price = {"$lte":priceLessThan};
        if(priceLessThan && priceGreaterThan) filter.price = {"$gte":priceGreaterThan,"$lte":priceLessThan};
        filter.isDeleted = false;

        let data = await productModel.find(filter);

        if(data.length == 0) return res.status(404).send({status:false,message:" Produts not found",});

        if(priceSort) data = priceSorter(data , priceSort);

        return res.status(200).send({status:true,message:"all Produts",data});

        }

}catch(err){return res.status(500).send({ status: false, message: err.message }); }
}

const getSingleProduct = async (req,res)=>{
    try{
        const productId = req.params.productId;

        if(!mongoose.isValidObjectId(productId)) return res.status(400).send({status:false, message: " Invalid productId format"})

        const data = await productModel.findById(productId);

        if(!data || data.isDeleted === true) return res.status(404).send({status:false, message: "product not found  😒"})

        return res.status(200).send({status:false, message: "product detail's ",data})

    }catch(err){return res.status(500).send({ status: false, message: err.message });}
}

const deleteProduct = async function(req,res){
    try{
        let productId = req.params.productId
        if(!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({status:false, message: `Opps! ${productId} is not a valid productId` })
        }
        let checkProduct = await productModel.findOne({_id:productId, isDeleted:false})
        if(!checkProduct) {
            return res.status(404).send({status:false, message:"Sorry ProductId not found"})
        }
        await productModel.findOneAndUpdate(
            {_id:productId},
            {isDeleted:true, deletedAt:new Date()},   
        )
        res.status(200).send({status:true, message:"Congrats ! Product has been deleted successfully"})

    }catch(err){return res.status(500).send({status:false, message:err.message})}
}

module.exports={ newProduct, getAllProduct, getSingleProduct,deleteProduct};



