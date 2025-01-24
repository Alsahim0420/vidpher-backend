const Story = require('./models/Story'); // Ajusta la ruta según tu proyecto
const fs = require('fs'); // Para trabajar con el sistema de archivos
const cloudinary = require('cloudinary').v2; // Para subir archivos a Cloudinary
const Story = require('./models/Story'); // Asegúrate de importar el modelo Story


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
                message: "No se ha subido ningún archivo",
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
                    message: "Error al borrar el archivo no válido",
                    error: err,
                });
            }

            return res.status(400).json({
                status: "error",
                message: "La extensión del archivo no es válida",
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
            suggested: req.body.suggested || false, // Opcional: sugerencia
        });

        await newStory.save();

        // Responder con éxito
        return res.status(200).json({
            status: "success",
            message: "Nueva historia creada exitosamente",
            story: newStory,
            imageUrl: result.secure_url,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: "error",
            message: "Error interno del servidor",
            error: err.message || err,
        });
    }
};

module.exports = {
    upload,
    prueba_story
};