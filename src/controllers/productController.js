const productModel = require('../models/productModel');
const { default: mongoose, } = require('mongoose');
const { isValidBody, isValid,  isValidFiles } = require('../validators/validator');
const {uploadFile} = require('../aws/upload');

let nameRegex = /^[a-zA-Z ]{2,20}$/;
let shippingRegex = /^(true|false)$/;
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
        
    if(!availableSizes){return res.status(400).send({ status: false, message: "available Sizes is required" });}
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

        return res.status(200).send({status:true, message: "product detail's ",data})

    }catch(err){return res.status(500).send({ status: false, message: err.message });}
}


const updateProduct = async (req, res) => {
    try {
        let productId = req.params.productId;
        let data = req.body;
        let files = req.files;
        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId not valid" });
        }
        let checkId = await productModel.findOne({$and:[{_id:productId},{isDeleted:false}]});
        if (!checkId) {
            return res.status(404).send({status:false, message:"productId does not exist or product is deleted."})
        }
        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "No data found to update." });
        }
        if (data.title) {
             if (!isValid(data.title)) {
            return res.status(400).send({ status: false, message: "title is required" });}
         if(!nameRegex.test(data.title)){
            return res.status(400).send({ status: false, message: "title should contain only alphabets" });
        }
        }
        const checkTitle = await productModel.findOne({ title: data.title })
        if (checkTitle) {
            return res.status(400).send({status:false, message:"title already exists. Please try another."})
        }
        if (data.description) {
            if (!isValid(data.description)) {
            return res.status(400).send({ status: false, message: "description is required" });}
        }
        if (data.price) {
            if (!isValid(data.price)) {
                return res.status(400).send({status:false, message:"price is required."})
            }
            let priceNum = parseInt(data.price);
            if (typeof priceNum !== 'number' && priceNum>0) {
                return res.status(400).send({status:false, message:"price should be a number"})
            }
        }
        if (data.currencyId) {
            if (!isValid(data.currencyId)) {
                return res.status(400).send({status:false, message:"provide currencyId."})
            }
            if (data.currencyId !== "INR") {
                return res.status(400).send({status:false, message:"provide currencyId should only be INR."})
            }
        }
        if (data.currencyFormat) {
            if (!isValid(data.currencyFormat)) {
                return res.status(400).send({status:false, message:"currency format is required"})
            }
            if (data.currencyFormat !== "₹") {
                return res.status(400).send({status:false, message:"currency format should be ₹ only"})
            }
            
        }
        if (data.isFreeShipping) {
            if (!isValid(data.isFreeShipping)) {
                return res.status(400).send({status:false, message:"isFreeShipping value required."})
            }
            if (!shippingRegex.test(data.isFreeShipping)) {
                return res.status(400).send({status:false, message:"it should have only only true and false" })
            }
            
        }
        if (data.style) {
            if (!isValid(data.style)) {
                return res.status(400).send({status:false, message:"style is required"})
            }
            if (typeof data.style !== "string") {
                return res.status(400).send({status:false, message:"style should be string"})
            }
        }
        if (data.availableSizes) {
            data.availableSizes = data.availableSizes.split(",")
            let arr = ["S", "XS", "M", "X", "L", "XXL", "XL"];
            let checkSize = data.availableSizes.every(ele => arr.indexOf(ele) != -1)
            if (!checkSize) {
                return res.status(400).send({status:false, message:"size should be from 'S', 'XS', 'M', 'X', 'L', 'XXL' and 'XL' only."})
            }
        }
        // console.log(sizeArr)
        // console.log(data.availableSizes)

        if (data.installments) {
            if (!isValid(data.installments)) {
                return res.status(400).send({status:false, message:"installments required"})
            }
            let numCheck = parseInt(data.installments)
            if (typeof numCheck !== "number" && numCheck>=0) {
                return res.status(400).send({status:false, message:"installment should be a number."})
            }
        }
          if (files.length) {
            const productPicture = await uploadFile(files[0]);
            data.productImage = productPicture;
          }
        const updateData = await productModel.findOneAndUpdate({ _id: checkId._id }, data, { new: true })
        return res.status(200).send({status:true, message:"updated successfully", data:updateData})
    } catch (err) {
        res.status(500).send({status:false, message:err.message})
    }
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





module.exports = { newProduct, getAllProduct, getSingleProduct, updateProduct,deleteProduct };

