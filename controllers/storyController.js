const fs = require('fs'); // Para trabajar con el sistema de archivos
const cloudinary = require('cloudinary').v2; // Para subir archivos a Cloudinary
const Story = require('../models/story'); // Asegúrate de importar el modelo Story
const Follow = require('../models/follow')



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




const allStories = async (req, res) => {
    try {
        // Obtener el ID del usuario logueado
        const userId = req.user.id;

        // Consultar los usuarios que sigue el usuario logueado
        const follows = await Follow.find({ user: userId }).select("followed").lean();

        // Extraer los IDs de los usuarios seguidos
        const followedUserIds = follows.map(follow => follow.followed);

        // Incluir el ID del usuario logueado en la lista de IDs
        followedUserIds.push(userId);

        // Si no sigue a nadie y no tiene historias propias, devolver un mensaje
        if (followedUserIds.length === 0) {
            return res.status(200).json({
                "status": "success",
                "message": "Stories retrieved successfully.",
                "agenda": [   ]
            });
        }

        // Consultar historias de los usuarios seguidos y del usuario logueado
        const stories = await Story.find({ user: { $in: followedUserIds } })
            .sort({ createdAt: -1 }) // Ordenar por fecha de creación (descendente)
            .select("-cloudinaryPublicId") // Opcional: excluir campos sensibles
            .populate("user", "-password") // Traer datos del usuario (nombre/avatar)
            .lean();

        // Si no hay historias, devolver un mensaje
        if (stories.length === 0) {
            return res.status(404).json({
                status: "error",
                message: "No stories found from the users you follow or from yourself",
            });
        }

        // Responder con las historias encontradas
        return res.status(200).json({
            status: "success",
            message: "Stories from followed users and your own retrieved successfully",
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
    allStories,
};