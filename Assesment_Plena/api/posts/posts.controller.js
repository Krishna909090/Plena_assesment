const express = require("express");
const router = express.Router();
const aws = require("aws-sdk");
let multerS3 = require("multer-s3");
const { validationResult, body } = require("express-validator");
let checkAuth = require("../../middleware/checkAuth");
const sqlite3 = require("sqlite3").verbose();
let multer = require("multer");

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

aws.config.update({
  secretAccessKey: "GaujsvxnGBLkUhRlG4wQsKsMfsFJ9NXT6xtiD8+j",
  accessKeyId:"AKIATD4M6YRVMURRGCNH",
  region: "us-east-1"
});

const fileFilter = (request, file, callback) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
  }
};

const upload = multer({
  fileFilter: fileFilter,
  storage: multerS3({
    s3: new aws.S3(),
    bucket:"plenabucket",
    key: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});





module.exports = router;

router.post(
  "/createPosts",
  checkAuth,
  upload.single("file"),
  body("title").exists().isLength({ min: 3, max: 20 }),
  body("description").isLength({ min: 10, max: 3000 }),
  body("tags").exists(),
  body("userId").exists(),
  createPosts
);
router.post("/getPost", checkAuth, getPost);
router.get("/getAllRecords", checkAuth, getAllRecords);
router.post("/updateRecords", checkAuth, updateRecords);
router.get("/getTagCounter", checkAuth, getTagCounter);
router.delete("/deleteRecordById/(:id)", checkAuth, deleteRecordById);
router.get("/getFilter", checkAuth, getFilter);


//To create Posts
async function createPosts(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return new Promise(async (resolve, reject) => {
      let params = req.body;
      let title = params.title.toLowerCase();
      let userId = params.userId;
      let description = params.description;
      let tag = params.tags.toLowerCase();
      let image = req.file.location;
      let isActive = 1;
      const Sql = `INSERT INTO post(title, userId, description,tags,image, isActive) VALUES(?,?,?,?,?,?)`;
      db.run(Sql, [title, userId, description, tag, image, isActive], (err) => {
        if (err) return reject( res.status(400).send({
          message: "title was already taken",
          status: 400
        }));
        else{
          let getSql = `SELECT * FROM post WHERE title = '${title}'`;
          db.all(getSql, [], (err, rows) => {
            if (err) {
             res.status(400).send({message : "Something went wrong", status:400})
            } else {
              resolve(
                res.status(200).send({
                  data: rows[0],
                  message: "Post was created successfully",
                  status: 200,
                })
              );
            }
          });
        }
      });
    });
  } catch (e) {
    console.log(e);
  }
}

//To get specfic Post by title
async function getPost(req, res) {
  try {
    let params = req.body;
    let title = params.title;
    let getSwql = `SELECT * FROM post WHERE title = '${title}'`;
    console.log(getSwql, "asdaadad");
    db.all(getSwql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      } else {
        res.status(200).send({ data: rows[0], status: 200 });
      }
    });
  } catch (e) {
    console.log(e);
  }
}


//To get All Posts
async function getAllRecords(req, res) {
  try {
    let getSwql = `SELECT * FROM post WHERE isActive = 1 ORDER BY created_at desc `;
    db.all(getSwql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      } else {
        console.log(rows, "Rowsdasdsaadadasas");
        res.status(200).send({ data: rows, status: 200 });
      }
    });
  } catch (e) {
    console.log(e);
  }
}


//To update all the specific post
async function updateRecords(req, res) {
  try {
    let params = req.body;
    let title = params.title;
    let description = params.description;
    let tag = params.tags.toLowerCase();
    let id = params.id;
    let updateSql = `UPDATE post SET title = '${title}', description = '${description}', tags = '${tag}'  WHERE id = ${id}`;
    db.all(updateSql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      }
      let getSql = `SELECT * FROM post WHERE title = '${title}'`;
      db.all(getSql, [], (err, rows) => {
        if (err) {
          return console.error(err.message);
        }
        res
          .status(200)
          .send({ data: rows[0], message: "Post was updated successfully" });
      });
    });
  } catch (e) {
    console.log(e);
  }
}

//To delete Post by Id
async function deleteRecordById(req, res) {
  try {
    console.log(req.params);
    let params = req.params;
    let id = params.id;
    let getSql = `UPDATE post SET isActive = 0 WHERE id = ${id} `;
    db.all(getSql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      } else {
        res
          .status(200)
          .send({ message: "Post deleted Sucessfully", status: 200 });
      }
    });
  } catch (e) {
    console.log(e);
  }
}


//To get Tag Counter
async function getTagCounter(req, res) {
  try {
    let getSql = `SELECT tags,count(*) as Total from post group by tags`;
    db.all(getSql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      } else {
        res.status(200).send({ data: rows, status: 200 });
      }
    });
  } catch (e) {
    console.log(e);
  }
}


//To get filter by tags, title, userId, by dates
async function getFilter(req, res) {
  try {
    if (req.query.title) {
      let title = req.query.title;
      req.query.title = title.toLowerCase();
    }
    let getSql = `SELECT * FROM post WHERE `;
    if (
      req.query.title &&
      req.query.tags &&
      req.query.userId &&
      req.query.fromDate &&
      req.query.toDate
    ) {
      getSql += ` title = '${req.query.title}' AND tags = '${req.query.tags}' AND userId = ${req.query.userId} AND BETWEEN '${req.query.fromDate}' AND '${req.query.toDate}'`;
    } else if (
      req.query.tags &&
      req.query.userId &&
      req.query.fromDate &&
      req.query.toDate
    ) {
      getSql += ` tags = '${req.query.tags}' AND userId = ${req.query.userId} AND BETWEEN '${req.query.fromDate}' AND '${req.query.toDate}'`;
    } else if (req.query.userId && req.query.fromDate && req.query.toDate) {
      getSql += ` userId = ${req.query.userId} AND BETWEEN '${req.query.fromDate}' AND '${req.query.toDate}'`;
    } else if (req.query.fromDate && req.query.toDate) {
      getSql += ` BETWEEN '${req.query.fromDate}' AND '${req.query.toDate}'`;
    } else if (req.query.title && req.query.tags && req.query.userId) {
      getSql += ` title = '${req.query.title}' AND tags = '${req.query.tags}' AND userId = ${req.query.userId}`;
    } else if (req.query.title && req.query.tags) {
      getSql += ` title = '${req.query.title}' AND tags = '${req.query.tags}'}`;
    } else if (req.query.title && req.query.userId) {
      getSql += ` title = '${req.query.title}' AND userId = ${req.query.userId}`;
    } else if (req.query.title) {
      getSql += `  title = '${req.query.title}'`;
    } else if (req.query.tags) {
      getSql += `  tags = '${req.query.tags}'`;
    } else {
      getSql += `  userId = ${req.query.userId}`;
    }

    db.all(getSql, [], (err, rows) => {
      if (err) {
        return console.error(err.message);
      } else {
        res.status(200).send({ data: rows, status: 200 });
      }
    });
  } catch (e) {
    console.log(e);
  }
}
