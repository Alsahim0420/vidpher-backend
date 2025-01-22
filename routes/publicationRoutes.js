const express = require('express');
const router = express.Router();
const multer = require('multer');
const publicationController = require('../controllers/publicationController');
const check = require("../middlewares/auth");

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, './uploads/publications/');
    },
    filename: (req, file, cb)=>{
        cb(null, "pub-"+Date.now()+"-"+file.originalname);
    }
});


const uploads = multer({storage});

//Definir las rutas de la API
router.get("/prueba_publication", publicationController.prueba_publication);
router.post("/save",check.auth, publicationController.save);
router.get("/detail/:id",check.auth, publicationController.detail);
router.delete("/remove/:id",check.auth, publicationController.remove);
router.get("/user/:id/:page?",check.auth, publicationController.user);
router.post("/upload/:id",[check.auth, uploads.single("file0")], publicationController.upload);
router.get("/media/:file", publicationController.media);
router.get("/feed/:page?",check.auth, publicationController.feed);
router.post("/:publicationId/like",check.auth, publicationController.likePublication);
router.post("/:publicationId/comment", check.auth, publicationController.addComment);
router.delete("/:publicationId/dislikePublication", check.auth, publicationController.dislikePublication);


//Exportar el modulo de rutas
module.exports = router;