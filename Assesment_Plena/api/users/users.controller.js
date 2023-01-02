const express = require("express");
const router = express.Router();
const { check, oneOf, validationResult, body } = require("express-validator");

let jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();

let db = new sqlite3.Database(
  "./database.db",
  sqlite3.OPEN_READWRITE,
  (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the in-memory SQlite database.");
  }
);

module.exports = router;

router.post(
  "/register",
  body("name").exists(),
  body("password").isLength({
    min: 6,
  }),
  body("email").exists(),
  register
);
router.post("/login", body("name").exists(),
body("password").isLength({
  min: 6,
}),
 authentication);


//Registration
async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let params = req.body;
    let name = params.name;
    let email = params.email;
    let password = params.password;
    let result;
    const Sql = `INSERT INTO users(name, email,password) VALUES(?,?,?)`;
    db.run(Sql, [name, email, password], (err) => {
      if (err) return console.log(err.message);
    });
    let getSql = `SELECT * FROM users WHERE name = '${name}'`;
    db.all(getSql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      } else {
        res
          .status(200)
          .send({
            data: rows[0],
            message: "user was created successfully",
            status: 200,
          });
      }
    });
  } catch (e) {
    console.log(e);
  }
}


//Login
async function authentication(req, res) {
  try {
    let params = req.body;
    let name = params.name;
    let password = params.password;
    let result;
    const Sql = `SELECT * FROM users WHERE name = '${name}'`;
    db.all(Sql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      }
      if (rows[0].password == password) {
        const token = jwt.sign(
          {
            name: name,
            time: new Date(),
          },
          "secret"
        );
        res
          .status(200)
          .send({ data: token, message: "Logged in successfully" });
      } else {
        res.status(400).send({ message: "Password was incorrect" });
      }
    });
  } catch (e) {
    console.log(e);
  }
}
