const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const check = require('../middlewares/auth');
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
router.get("/prueba_user", check.auth, userController.prueba_user);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile/:id", check.auth, userController.profile);
router.get("/list/:page?", check.auth, userController.list);

// ✅ Ruta única para actualizar usuario y subir imagen
router.put("/update", [check.auth, upload.single("file0")], userController.update);

router.get("/avatar/:file", userController.avatar);
router.get("/counters/:id", check.auth, userController.counters);
router.post('/request/password/reset', userController.requestPasswordReset);
router.post('/reset/password', userController.resetPassword);

router.post("/update/fcm/token", check.auth, userController.updateFcmToken);

//Dashboard
router.get('/users/count/by/role', check.auth, userController.countUsersByRole);

// Ruta para buscar
router.get("/search", check.auth, userController.searchAll);

// Exportar el módulo de rutas
module.exports = router;
