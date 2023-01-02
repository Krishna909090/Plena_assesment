const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const async = require("async");
const app = express();
const cors = require("cors")
const createTables = require("./config/database")
createTables.createTables();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.use(function (req, res, next) {
    // res.setHeader()
     res.setHeader("Access-Control-Allow-Origin", "*");
     res.setHeader(
       "Access-Control-Allow-Headers",
       "Origin, X-Requested-With, Content-Type, Accept"
     );
     res.setHeader(
       "Access-Control-Allow-Methods",
       "POST, GET, PATCH, DELETE, OPTIONS"
     );
     next();
   });

app.use(express.urlencoded({ extended: false }));

app.use("/posts",require("./api/posts/posts.controller"))
app.use("/users", require("./api/users/users.controller"))


app.listen(3000, () => console.log('Server started'));

module.exports = app