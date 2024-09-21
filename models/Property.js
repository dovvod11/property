const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  images: [
    {
      type: String,
    },
  ],
  address: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Property", PropertySchema);
