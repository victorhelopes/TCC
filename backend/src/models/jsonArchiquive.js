const mongoose = require("mongoose");

const jsonArchiveSchema = new mongoose.Schema({
  name: String,
  key: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("jsonArchive", jsonArchiveSchema);
