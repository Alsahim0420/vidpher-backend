const express = require('express');
const router = express.Router();
const multer = require('multer');
const storyController = require('../controllers/storyController');
const check = require("../middlewares/auth");

// Use memory storage instead of disk storage for Vercel compatibility
const storage = multer.memoryStorage();

const upload = multer({ storage });


router.post("/upload", [check.auth, upload.single("file0")], storyController.upload);
router.get("/allStories", check.auth, storyController.allStories);


module.exports = router;