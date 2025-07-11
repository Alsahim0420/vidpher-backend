const express = require('express');
const router = express.Router();
const multer = require('multer');
const publicationController = require('../controllers/publicationController');
const check = require("../middlewares/auth");

// Use memory storage instead of disk storage for Vercel compatibility
const storage = multer.memoryStorage();

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


//Dashboard
router.get("/allPublications", check.auth, publicationController.allPublications);
router.put('/updatePublication/:id', [check.auth, upload.single("file0")], publicationController.updatePublication);
router.put('/update/:publicationId/toggle/watch', check.auth, publicationController.toggleWatchPublication);
router.delete('/delete/data/:id', check.auth, publicationController.deleteItem);

// Exportar el módulo de rutas
module.exports = router;
