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

//Creating table if not exists
function createTables() {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          name TEXT,
          email TEXT UNIQUE,
          password TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
      (err) => {
        if (err) {
          console.error(err.message);
        }
        console.log("Table created successfully");
      }
    );
    db.run(
      `CREATE TABLE IF NOT EXISTS post (
      id INTEGER PRIMARY KEY,
      userId INTEGER,
      title TEXT NOT NULL UNIQUE,
      description TEXT,
      tags TEXT,
      image TEXT,
      isActive INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
      
    )`,
      (err) => {
        if (err) {
          console.error(err.message);
        }
        console.log("Table created successfully");
      }
    );
  }
  
  module.exports = {
    createTables
  }