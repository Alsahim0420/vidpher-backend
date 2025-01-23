const fs = require('fs'); // Para manejar archivos locales
const cloudinary = require('../config/cloudinary-config'); // Importar configuración de Cloudinary
const userController = require('../controllers/userController'); // Controlador del usuario


// Función para manejar la subida de avatar
const uploadAvatar = async (req, res) => {
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
};

// Exportar la función
module.exports = uploadAvatar;
