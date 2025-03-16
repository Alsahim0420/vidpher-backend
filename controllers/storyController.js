const fs = require('fs'); // Para trabajar con el sistema de archivos
const cloudinary = require('cloudinary').v2; // Para subir archivos a Cloudinary
const Story = require('../models/story'); // Asegúrate de importar el modelo Story
const Follow = require('../models/follow')
const User = require('../models/user'); // Asegúrate de importar el modelo User



const upload = async (req, res) => {
    try {
        console.log("User ID:", req.user.id);

        // Poblar el usuario excluyendo la contraseña
        const populatedUser = await User.findById(req.user.id).select("-password");

        // Verificar si se envió un archivo
        if (!req.file) {
            return res.status(400).json({
                status: "error",
                message: "No file uploaded",
            });
        }

        const file = req.file.originalname;
        const extension = file.split(".").pop().toLowerCase();

        // Extensiones permitidas
        const imageExtensions = ["jpg", "jpeg", "png", "gif"];
        const videoExtensions = ["mp4", "mov", "avi", "mkv"];

        let resourceType = "auto"; // Predeterminado, Cloudinary decidirá el tipo

        if (imageExtensions.includes(extension)) {
            resourceType = "image";
        } else if (videoExtensions.includes(extension)) {
            resourceType = "video";
        } else {
            // Si la extensión no es válida, eliminar archivo y devolver error
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({
                status: "error",
                message: "File extension is invalid",
            });
        }

        try {
            // Subir archivo a Cloudinary con el tipo adecuado
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "stories",
                resource_type: resourceType,
            });

            // Eliminar archivo temporal
            await fs.promises.unlink(req.file.path).catch(() => {});

            // Crear una nueva historia en la base de datos
            const newStory = new Story({
                user: populatedUser,
                text: req.body.text || "",
                file: result.secure_url,
                cloudinaryPublicId: result.public_id,
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                suggested: req.body.suggested || false,
            });

            await newStory.save();
            const populatedStory = await newStory.populate("user", "-password -__v -role -email");

            return res.status(200).json({
                status: "success",
                message: "New story successfully created",
                story: populatedStory,
            });
        } catch (cloudinaryError) {
            await fs.promises.unlink(req.file.path).catch(() => {});
            return res.status(400).json({
                status: "error",
                message: "Invalid file upload",
                error: cloudinaryError.message || cloudinaryError,
            });
        }
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