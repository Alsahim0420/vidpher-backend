const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const check = require('../middlewares/auth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads")); // Asegurar la ruta correcta
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
router.put("/update", [check.auth, uploads.single("file0")], userController.update);

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
