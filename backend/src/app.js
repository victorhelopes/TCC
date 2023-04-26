const express = require("express"); // importantando a o express pra variavel express
const routes = require("./routes");
const mongoose = require("mongoose");

const app = express();

mongoose.connect(
  "mongodb+srv://FeiraEJ:FeiraEJ@cluster0.wr1cu.mongodb.net/?retryWrites=true&w=majority"
);

app.use(express.json());
app.use(routes);

module.exports = app;
