const fs = require('fs'); // Para trabajar con el sistema de archivos
const cloudinary = require('cloudinary').v2; // Para subir archivos a Cloudinary
const Story = require('../models/story'); // Asegúrate de importar el modelo Story


//acciones de prueba 
const prueba_story = (req, res) => {
    return res.status(200).json({
        message: 'mensaje enviado desde: storyController.js',
        usuario: req.user
    })
};

const upload = async (req, res) => {
    try {
        console.log('User ID:', req.user.id);

        // Verificar si se envió un archivo
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No file uploaded",
            });
        }

        // Obtener el nombre del archivo y la extensión
        const file = req.file.originalname;
        const extension = file.split('.').pop().toLowerCase();

        // Validar la extensión del archivo
        if (!["jpg", "jpeg", "png", "gif"].includes(extension)) {
            try {
                await fs.unlinkSync(req.file.path); // Eliminar archivo
            } catch (err) {
                return res.status(500).json({
                    status: "error",
                    message: "Failed to delete invalid file",
                    error: err,
                });
            }

            return res.status(400).json({
                status: "error",
                message: "File extension is invalid",
            });
        }

        // Subir archivo a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'stories', // Carpeta opcional en Cloudinary
        });

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);

        // Crear una nueva historia en la base de datos
        const newStory = new Story({
            user: req.user.id,
            text: req.body.text || "", // Texto opcional en el cuerpo de la solicitud
            file: result.secure_url,
            cloudinaryPublicId: result.public_id, // Guardar el ID público de Cloudinary
            expiresAt: Date.now() + 24 * 60 * 60 * 1000, // Expira en 24 horas
            suggested: req.body.suggested || false, // Opcional: sugerencia
        });

        await newStory.save();

        // Responder con éxito
        return res.status(200).json({
            status: "success",
            message: "New story successfully created",
            story: newStory,
            imageUrl: result.secure_url,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
            error: err.message || err,
        });
    }
};


module.exports = {
    upload,
    prueba_story
};