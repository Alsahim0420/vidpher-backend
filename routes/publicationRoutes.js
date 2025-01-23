const express = require('express');
const router = express.Router();
const multer = require('multer');
const publicationController = require('../controllers/publicationController');
const check = require("../middlewares/auth");
const cloudinary = require('../config/cloudinary-config');
const fs = require('fs');

// Configuración de subida temporal
const uploads = multer({ dest: 'temp/' });

// Definir las rutas de la API
router.get("/prueba_publication", publicationController.prueba_publication);
router.post("/save", check.auth, publicationController.save);
router.get("/detail/:id", check.auth, publicationController.detail);
router.delete("/remove/:id", check.auth, publicationController.remove);
router.get("/user/:id/:page?", check.auth, publicationController.user);

// Modificar la ruta de subida para usar Cloudinary
router.post("/upload/:id", [check.auth, uploads.single("file0")], async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
        }

        // Subir archivo a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'publications',
        });

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);

        // Actualizar la publicación con la URL del archivo
        const updatedPublication = await publicationController.media(req.params.id, result.secure_url);

        res.status(200).json({
            message: 'Archivo subido y asociado a la publicación exitosamente.',
            publication: updatedPublication,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al subir el archivo.' });
    }
});

router.get("/media/:file", publicationController.media);
router.get("/feed/:page?", check.auth, publicationController.feed);
router.post("/:publicationId/like", check.auth, publicationController.likePublication);
router.post("/:publicationId/comment", check.auth, publicationController.addComment);
router.delete("/:publicationId/dislikePublication", check.auth, publicationController.dislikePublication);

// Exportar el módulo de rutas
module.exports = router;
