const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true, // trim the spaces before and after the fullname
      required: true,
      max: 12,
      unique: true,
      index: true, // this gives performance boost when Querying
      lowercase: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      max: 32,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      max: 32,
      lowercase: true, // On the internet upper-case and lower-case letters in email addresses are same
    },
    hashed_password: {
      type: String,
      required: true,
    },
    salt: String, // salt is the strength of the password
    // categories: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: "Category",
    //     required: true,
    //   },
    // ],
  },
  { timestamps: true }
); // will automatically get **createdAt & updatedAt**

userSchema
  .virtual("password")
  .set(function (password) {
    // temporary
    this._password = password;

    // generate salt

    this.salt = this.makeSalt();

    // encrypt password

    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

// methods > authenticate, encryptPassword, makeSalt

userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function (password) {
    if (!password) return "";

    try {
      return crypto
        .createHmac("sha1", this.salt) // from the salt stored in db we can hash the typed password
        .update(password)
        .digest("hex");
    } catch (err) {
      return "";
    }
  },

  makeSalt: function () {
    return Math.round(new Date().valueOf() * Math.random()) + "";
  },
};

module.exports = mongoose.model("User", userSchema);
