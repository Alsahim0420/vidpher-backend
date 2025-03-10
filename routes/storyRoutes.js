const express = require('express');
const router = express.Router();
const multer = require('multer');
const storyController = require('../controllers/storyController');
const check = require("../middlewares/auth");
const fs = require("fs");
const path = require("path");

// Ruta absoluta para la carpeta uploads
const uploadDir = path.join(__dirname, "uploads");

// Verifica si la carpeta 'uploads' existe, si no, la crea
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Ahora la carpeta existe antes de guardar el archivo
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });



router.post("/upload", [check.auth, upload.single("file0")], storyController.upload);
router.get("/allStories", check.auth, storyController.allStories);


module.exports = router;