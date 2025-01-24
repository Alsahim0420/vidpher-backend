const express = require('express');
const router = express.Router();
const multer = require('multer');
const storyController = require('../controllers/storyController');
const check = require("../middlewares/auth");

// Configuración de subida temporal
const uploads = multer({ dest: 'temp/' });

router.post("/upload", [check.auth, uploads.single("file0")], storyController.upload);