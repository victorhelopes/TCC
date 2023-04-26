const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

module.exports = {
  dest: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "..", "tmp", "uploads"));
    },
    filename: (req, file, cb) => {
      crypto.randomBytes(16, (err, hash) => {
        if (err) cb(err);

        const filename = `${hash.toString("hex")}-${file.originalname}`;
        cb(null, filename);
      });
      // cb(null, file.originalname);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedFiles = ["application/json"];
    if (allowedFiles.includes(file.mimetype)) cb(null, true);
    else {
      cb(new Error("Invalid file type"));
    }
  },
};
