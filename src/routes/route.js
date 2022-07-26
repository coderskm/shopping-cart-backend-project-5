const express = require("express");
const { authentication } = require("../Auth/userAuth");
const router = express.Router();
const {registerUser,login, getProducts} = require('../controllers/userController')

router.post("/register", registerUser); 
router.post("/login", login); 
router.get("/user/:userId/profile", authentication, getProducts);

router.all("*", function (req, res) {
  return res.status(404).send({ status: false, message: "invalid URL" });
});

module.exports = router;
