const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const check = require('../middlewares/auth');

// Configuración de subida
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        cb(null, './uploads/avatars/');
    },
    filename: (req, file, cb)=>{
        cb(null, "avatar-"+Date.now()+"-"+file.originalname);
    }
});


const uploads = multer({storage});

//Definir las rutas de la API
router.get("/prueba_user", check.auth, userController.prueba_user);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile/:id", check.auth, userController.profile);
router.get("/list/:page?", check.auth, userController.list);
router.put("/update", check.auth, userController.update);
router.post("/upload", [check.auth, uploads.single("file0")], userController.upload);
router.get("/avatar/:file", userController.avatar);
router.get("/counters/:id", check.auth, userController.counters);
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);


//Exportar el modulo de rutas
module.exports = router;