const User = require("../models/user");
const AWS = require("aws-sdk");
const jwt = require("jsonwebtoken"); // used for signing, verifying & decoding
// express-jwt is used to check the validity of *token from headers* by performing series of validations & the decoded info will be available to us in *req.user* by default
const { registerEmailParams } = require("../helpers/email");
const { default: ShortUniqueId } = require("short-unique-id");
const uid = new ShortUniqueId();
const expressJWT = require("express-jwt");
const _ = require("lodash");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.register = (req, res) => {
  const { name, email, password, categories } = req.body;

  // check if user exists in the db

  User.findOne({ email: email }).exec((err, user) => {
    console.log(user);

    if (user) {
      return res.status(400).json({
        error: "Invalid email or email is already taken",
      });
    }

    // Generate JWT with name, email, password

    const token = jwt.sign(
      { name, email, password, categories },
      process.env.JWT_ACCOUNT_ACTIVATION, // secret key
      {
        expiresIn: "10m", // acccount should be activated in 10 mins before token expires
      }
    );

    // CREATE A TEMPLATE FOR THE EMAIL
    const params = registerEmailParams(email, token);

    // SEND THE EMAIL
    const sendEmailOnRegister = ses.sendEmail(params).promise();

    sendEmailOnRegister
      .then((data) => {
        console.log("email submitted fo SES", data);
        res.status(200).json({
          message: `Email has been sent to ${email}, Click on the link in the email to complete your registration`,
        });
      })
      .catch((error) => {
        console.log("SES email error on register", error);
        res.status(406).json({
          error: `Cannot Verify Your Email plz try again`,
        });
      });

    // SEND EMAIL END
  });
};

exports.registerActivate = (req, res) => {
  const { token } = req.body;

  jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, (err, decodedInfo) => {
    if (err) {
      return res.status(401).json({ error: "Token has expired, Try again !" });
    }
    console.log("decoded info", decodedInfo);

    const { name, email, password } = decodedInfo;

    const username = name + "#" + uid();

    const newUser = new User({ username, name, email, password, categories }); // already checked in above function if mail is taken
    newUser.save((err, user) => {
      if (err) {
        return res
          .status(401)
          .json({ error: "Error saving user in the database. Try later" });
      }

      return res.json({
        message: "Registered successfully. Please Login",
      });
    });
  });
};

exports.login = async (req, res) => {
  // destructuring *email* and naming it *rEmail*
  const { email: rEmail, password: rPassword } = req.body;
  // console.table({ email, password });

  // User.findOne({email: email}).exec((err, user)=>{/* All the stuff */})//Promise way

  const user = await User.findOne({ email: rEmail });
  // user is null if not present & !null -> true
  if (!user) {
    return res.status(400).json({
      error: "User with that email does not exist. Please register",
    });
  }

  // authenticate method of User Schema
  if (!user.authenticate(rPassword)) {
    return res.status(400).json({
      error: "Email and password do not match",
    });
  }

  // generate token and send to client
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    // as the payload is *id only* when the token decoded by *express-jwt* , *id* will be available to us as *req.user.id*
    expiresIn: "7d", // expire after 7 days
  });

  const { _id, name, email } = user;

  return res.json({
    token,
    user: { _id, name, email },
  });
};

// looks for token in the headers & decodes and adds the decodedInfo(payload passed during signing in) in *req.user*
exports.requireSignIn = expressJWT({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
}); // gives -> req.user._id

// we can Create our middlewares directory and add this there
exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    // We don't want to use totally different routes to perform same action so commenting
    // if (user.role === "admin") {
    //   return res
    //     .status(400)
    //     .json({ error: "No need for Admin to access user routes" });
    // }

    req.profile = user; // adding in the request
    next();
  });
};
