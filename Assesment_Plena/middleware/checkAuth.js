let jwt = require("jsonwebtoken")
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



async function checkAuth(req,res,next){
    console.log(req.headers.authorization)
    if(req.headers.authorization){
      let decode = jwt.verify(req.headers.authorization, "secret")
      console.log(decode, "decodeee")
      let name = decode.name
      const Sql = `SELECT * FROM users WHERE name = '${name}'`;
      db.all(Sql, [], (err,rows) => {
          if (err) {
              return console.error(err.message);
            }
          if(rows[0].name == decode.name){
            next()
          }
          else {
              res
              .status(400)
              .send({ message: "Access Denied" });
          }
          });
    }
    else {
      res
      .status(400)
      .send({ message: "Access Denied" });
    }
}

module.exports = checkAuth