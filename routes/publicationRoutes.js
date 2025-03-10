const express = require('express');
const router = express.Router();
const multer = require('multer');
const publicationController = require('../controllers/publicationController');
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




// Definir las rutas de la API
router.get("/prueba_publication", publicationController.prueba_publication);
router.post("/save", [check.auth, upload.single("file0")], publicationController.save);
router.get("/detail/:id", check.auth, publicationController.detail);
router.delete("/remove/:id", check.auth, publicationController.remove);
router.get("/user/:id/:page?", check.auth, publicationController.user);
router.get("/media", publicationController.media);
router.get("/feed", check.auth, publicationController.feed);
router.post("/:publicationId/like", check.auth, publicationController.likePublication);
router.post("/:publicationId/comment", check.auth, publicationController.addComment);
router.put('/update/:publicationId/toggle/watch', check.auth, publicationController.toggleWatchPublication);

//Dashboard
router.get("/allPublications", check.auth, publicationController.allPublications);
router.put('/updatePublication/:id', [check.auth, upload.single("file0")], publicationController.updatePublication);

// Exportar el módulo de rutas
module.exports = router;
