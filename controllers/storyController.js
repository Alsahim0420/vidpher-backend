const fs = require('fs'); // Para trabajar con el sistema de archivos
const cloudinary = require('cloudinary').v2; // Para subir archivos a Cloudinary
const Story = require('../models/story'); // Asegúrate de importar el modelo Story
const Follow = require('../models/follow')


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
        if (!["jpg", "jpeg", "png", "gif", "mp4", "mov", "avi", "mkv"].includes(extension)) {
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

const myStories = async (req, res) => {
    try {
        // Obtener el ID del usuario logueado
        const userId = req.user.id;

        // Consultar las historias creadas por el usuario
        const stories = await Story.find({ user: userId })
            .sort({ createdAt: -1 }) // Ordenar por fecha de creación (descendente)
            .select("-cloudinaryPublicId"); // Opcional: excluir campos sensibles como `cloudinaryPublicId`

        // Verificar si el usuario tiene historias
        if (stories.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No stories found for this user",
            });
        }

        // Responder con éxito y devolver las historias
        return res.status(200).json({
            status: "success",
            message: "Stories retrieved successfully",
            stories,
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


const followedStories = async (req, res) => {
    try {
        // Obtener el ID del usuario logueado
        const userId = req.user.id;

        // Consultar los usuarios que sigue el usuario logueado
        const follows = await Follow.find({ user: userId }).select("followed").lean();

        // Extraer los IDs de los usuarios seguidos
        const followedUserIds = follows.map(follow => follow.followed);

        // Si no sigue a nadie, devolver un mensaje
        if (followedUserIds.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "You are not following anyone, so no stories are available",
            });
        }

        // Consultar historias de los usuarios seguidos
        const stories = await Story.find({ user: { $in: followedUserIds } })
            .sort({ createdAt: -1 }) // Ordenar por fecha de creación (descendente)
            .select("-cloudinaryPublicId") // Opcional: excluir campos sensibles
            .populate("user", "username avatar") // Traer datos del usuario (nombre/avatar)
            .lean();

        // Si no hay historias, devolver un mensaje
        if (stories.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No stories found from the users you follow",
            });
        }

        // Responder con las historias encontradas
        return res.status(200).json({
            status: "success",
            message: "Stories from followed users retrieved successfully",
            stories,
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
    prueba_story,
    myStories,
    followedStories
};