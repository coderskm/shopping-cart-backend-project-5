const express = require("express");
const route = require("./routes/route.js");
const mongoose = require("mongoose");
const multer = require("multer");
const app = express();
const uploadImage = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(uploadImage.any());

mongoose
  .connect("mongodb+srv://sumitkm:<password>@cluster0.tuxaaky.mongodb.net/group62Database")
  .then(() => console.log("MongoDb is connected 💯 ✅"))
  .catch((err) => console.log(err));

app.use("/", route);

app.listen(process.env.PORT || 3000, function () {
  console.log("Express app running on port " + (process.env.PORT || 3000));
});
