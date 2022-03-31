const mongoose = require("mongoose");
const crypto = require("crypto");

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
    },
    by_organization: {
      type: String,
      trim: true,
      required: false, // On the internet upper-case and lower-case letters in email addresses are same
    },
    // "active", "inactive"
    status: {
      type: String,
      required: true,
    },
    
  },
  { timestamps: true }
); // will automatically get **createdAt & updatedAt**

module.exports = mongoose.model("Certifications", certificationSchema);
