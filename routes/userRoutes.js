const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs'); // Para manejar archivos locales
const cloudinary = require('../config/cloudinary-config'); // Importar configuración de Cloudinary
const userController = require('../controllers/userController');
const check = require('../middlewares/auth');

// Configuración de Multer para almacenamiento temporal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/avatars/');
    },
    filename: (req, file, cb) => {
        cb(null, "avatar-" + Date.now() + "-" + file.originalname);
    }
});

const uploads = multer({ storage });

// Definir las rutas de la API
router.get("/prueba_user", check.auth, userController.prueba_user);
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile/:id", check.auth, userController.profile);
router.get("/list/:page?", check.auth, userController.list);
router.put("/update", check.auth, userController.update);

// Ruta para subir avatar usando Cloudinary
router.post("/upload", [check.auth, uploads.single("file0")], async (req, res) => {
    try {
        // Verifica que se haya subido un archivo
        if (!req.file) {
            return res.status(400).json({ message: "No se ha subido ningún archivo." });
        }

        // Subir archivo a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars', // Carpeta opcional en Cloudinary
        });

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);

        // Llama al controlador para actualizar el usuario con la URL del avatar
        const updatedUser = await userController.updateAvatar(req.user.id, result.secure_url);

        res.status(200).json({
            message: "Avatar subido correctamente.",
            avatarUrl: result.secure_url,
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al subir el avatar." });
    }
});

router.get("/avatar/:file", userController.avatar);
router.get("/counters/:id", check.auth, userController.counters);
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);

// Exportar el módulo de rutas
module.exports = router;
