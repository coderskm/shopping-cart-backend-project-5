const cartModel = require('../models/cartModel');
const { default: mongoose } = require('mongoose');
const productModel = require('../models/productModel');
const userModel = require('../models/userModel')
const cartCreation = async function (req, res) {
  try {
    let userId = req.params.userId;
    let cartId = req.body.cartId;
    let productId = req.body.productId;

    if (!productId) return res.status(400).send({ status: false, message: " Plsase Enter productId  " });

    if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: " Invalid userId format" });

    if (!mongoose.isValidObjectId(productId)) return res.status(400).send({ status: false, message: " Invalid productId format" })

    let quantity = 1;

    const userCheck = await userModel.findOne({ userId });

    if (!userCheck) { return res.status(404).send({ status: false, message: "No such user exists" }) }

    const productCheck = await productModel.findOne({ _id: productId, isDeleted: false })

    if (!productCheck) { return res.status(404).send({ status: false, message: "the product doesnt exist or is deleted" }) }

    const cartCheck = await cartModel.findOne({ userId });

    if (!cartCheck) {
      let cartItems = {}
      cartItems.userId = userId
      cartItems.items = { productId, quantity }
      cartItems.totalPrice = productCheck.price * quantity;
      cartItems.totalItems = 1
      const newCart = (await cartModel.create(cartItems)).populate({ path: "items.productId" })
      return res.status(201).send({ status: true, data: newCart })
    } else {
      if (!cartId) return res.status(400).send({ status: false, message: "Enter your respective cart ID " })

      if (!mongoose.isValidObjectId(cartId)) return res.status(400).send({ status: false, message: " Invalid cartId format" })

      const getCart = await cartModel.findOne({ _id: cartId, userId });

      if (!getCart) return res.status(404).send({ status: false, message: "UserId and CartId don't match." })

      let isAvilableProduct = getCart.items.some(ele => ele.productId == productId);

      if (isAvilableProduct) {
        const oldCart = await cartModel.findOneAndUpdate({ _id: cartId, "items.productId": productId }, { $inc: { totalPrice: +productCheck.price, "items.$.quantity": +1, } }, { new: true }).populate({ path: "items.productId" })

        return res.status(201).send({ status: true, data: oldCart })
      } else {
        const oldCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $push: { items: { productId, quantity } }, totalPrice: cartCheck.totalPrice + productCheck.price * quantity, totalItems: cartCheck.items.length + 1 }, { new: true }).populate({ path: "items.productId" })

        return res.status(201).send({ status: true, data: oldCart })
      }
    }
  } catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}

const getCart = async function (req, res) {
  try {
    let userId = req.params.userId;
    if (!mongoose.isValidObjectId(userId)) return res.status(400).send({ status: false, message: " Invalid userId format" })

    const userCheck = await userModel.find({ userId })
    if (!userCheck) { return res.status(404).send({ status: false, message: "User not found" }) }

    const cartCheck = await cartModel.findOne({ userId }).populate('items.productId')
    if (!cartCheck) { return res.status(404).send({ status: false, message: "No cart found for this user" }) }

    return res.status(200).send({ status: true, data: cartCheck })
  } catch (err) { return res.status(500).send({ status: false, message: err.message }) }
}

const updateCart = async function (req, res) {
  try {
    const userId = req.params.userId;
    const requestBody = req.body;
    const { cartId, productId, removeProduct } = requestBody;

    if (!mongoose.isValidObjectId(userId)) {
      return res
        .status(400)
        .send({ status: false, message: "userId not valid" });
    }

    if (!isValidBody(requestBody)) {
      return res
        .status(400)
        .send({ status: false, message: "no data found to update" });
    }
    if (!mongoose.isValidObjectId(cartId)) {
      return res
        .status(400)
        .send({ status: false, message: "cartId not valid" });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res
        .status(400)
        .send({ status: false, message: "productId not valid" });
    }
    //!/^(1|0)$/.test(removeProduct)
    // if (removeProduct != 0 || removeProduct != 1) {
    //     return res.status(400).send({status:false, message:"removeProduct value should be 0 or 1"})
    // }
    const checkUser = await userModel.findOne({ _id: userId });
    if (!checkUser) {
      return res.status(404).send({status: false,message: "user with given userId does not exist",});
    }
    const checkCart = await cartModel.findOne({ _id: cartId });
    if (!checkCart) {return res.status(404).send({status: false,message: "Cart with given cartId does not exist",});
    }
    const checkProduct = await productModel.findOne({
      _id: productId,
      isDeleted: false,
    });
    if (!checkProduct) {
      return res
        .status(404)
        .send({
          status: false,
          message: "product with given productId does not exist",
        });
    }

    // 0 to remove product
    // 1 to decrease quantity
    let cartArray = checkCart.items; // accessing array of product "items" from cart collection
    for (let i = 0; i < cartArray.length; i++) {
      if (cartArray[i].productId == productId) { // checking whether product of specified productId exist or not in given items in cart
        let Price = cartArray[i].quantity * checkProduct.price; // total price of item which we want to delete
        if (removeProduct == 0) {
          const updatedCartItem = await cartModel.findOneAndUpdate(
            { _id: cartId },
            {
              $pull: { items: { productId: productId } }, // pull to remove product which we want to delete 
              totalPrice: checkCart.totalPrice - Price, // updating total price by removing price of deleted product from total price of all products
              totalItems: checkCart.totalItems - 1, // as we delete product, total count of items will also decrease by 1 at a time.
            },
            { new: true }
          );

          return res
            .status(200)
            .send({
              status: true,
              message: "removed product",
              data: updatedCartItem,
            });
        }
        if (removeProduct == 1) {
          if (cartArray[i].quantity == 1 && removeProduct == 1) { // removing product if its total count becomes 0 after deleting it.
            const updateCartQuantity = await cartModel.findOneAndUpdate(
              { _id: cartId },
              {
                $pull: { items: { productId: productId } },
                totalPrice: checkCart.totalPrice - Price,
                totalItems: checkCart.totalItems - 1,
              },
              { new: true }
            );

            return res
              .status(200)
              .send({
                status: true,
                message: "removed product",
                data: updateCartQuantity,
              });
          }
          cartArray[i].quantity = cartArray[i].quantity - 1; // decreasing the quantity of product by 1 at a time 
          const updateCart = await cartModel.findOneAndUpdate(
            { _id: cartId },
            {
              items: cartArray,
              totalPrice: checkCart.totalPrice - checkProduct.price, // updating total price by decreasing total price by item's price whose quantity we reduced.
            },
            { new: true }
          );
          return res
            .status(200)
            .send({
              status: true,
              message: "decreased quantity",
              data: updateCart,
            });
        }
      }
    }
  } catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}

const deleteCart = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).send({ status: false, message: "userId not valid" });
    }

    const checkUser = await userModel.findById(userId)
    if (!checkUser) {
      return res.status(404).send({ status: false, message: "user with given userId does not exist" })
    }
    const checkCart = await cartModel.findOne({ userId: userId })
    if (!checkCart) {
      return res.status(404).send({ status: false, message: "Cart with given userId does not exist" })
    }


    const deleteCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true });
    return res.status(200).send({ status: false, message: "cart is deleted" })

  } catch (err) {
    res.status(500).send({ status: false, message: err.message })
  }
}

module.exports = { cartCreation, getCart, updateCart, deleteCart }