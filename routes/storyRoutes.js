const express = require('express');
const router = express.Router();
const multer = require('multer');
const storyController = require('../controllers/storyController');
const check = require("../middlewares/auth");
const path = require("path");


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads")); // Asegurar la ruta correcta
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });


router.post("/upload", [check.auth, upload.single("file0")], storyController.upload);
router.get("/allStories", check.auth, storyController.allStories);


module.exports = router;