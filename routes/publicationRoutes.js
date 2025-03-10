const express = require('express');
const router = express.Router();
const multer = require('multer');
const publicationController = require('../controllers/publicationController');
const check = require("../middlewares/auth");


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de que esta carpeta exista
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploads = multer({ storage: storage });


// Definir las rutas de la API
router.get("/prueba_publication", publicationController.prueba_publication);
router.post("/save", [check.auth, uploads.single("file0")], publicationController.save);
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
router.put('/updatePublication/:id', [check.auth, uploads.single("file0")], publicationController.updatePublication);

// Exportar el módulo de rutas
module.exports = router;
