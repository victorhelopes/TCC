const express = require("express");
const routes = express.Router();
const multer = require("multer");
const multerConfig = require("./config/multer");

const conversor = require("./Controllers/conversor");

routes.get("/", conversor.get);
routes.post("/", multer(multerConfig).single("file"), conversor.post);

module.exports = routes;
