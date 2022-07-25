const express = require("express");
const router = express.Router();
const {registerUser,login} = require('../controllers/userController')

router.post("/register", registerUser); 
router.post("/login", login); 

router.all("*", function (req, res) {
  return res.status(400).send({ status: false, message: "invalid URL" });
});

module.exports = router;
