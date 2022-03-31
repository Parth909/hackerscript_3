const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// db
mongoose
  .connect(process.env.DATABASE_CLOUD, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB Connected"))
  .catch((err) => console.log(err));

//import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

// app middlewares
app.use(morgan("dev"));
// app.use(express.json());
app.use(express.json({ limit: "5mb", type: "application/json" }));
// app.use(cors()); // to allow communication between different domains like FrontEnd Backend or basically between different Domains
app.use(cors({ origin: process.env.CLIENT_URL }));

// middlewares
app.use("/api", authRoutes);
app.use("/api", userRoutes);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Api is running on port ${port}`);
});
