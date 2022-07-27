const express = require("express");
const router = express.Router();

const { authentication ,authorisation} = require("../Auth/userAuth");
const {registerUser,login, getProfile,updateUser} = require('../controllers/userController')


/* USER API's */
router.post("/register", registerUser); 
router.post("/login", login); 
router.get("/user/:userId/profile", authentication, getProfile);
router.put("/user/:userId/profile", authentication,authorisation, updateUser);

/* PRODUCT API's */

/*BAD URL */
router.all("*", function (req, res) {
  return res.status(404).send({ status: false, message: "invalid URL" });
});

module.exports = router;
