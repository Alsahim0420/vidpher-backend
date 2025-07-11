// Importar dependencias
const cloudinary = require('cloudinary').v2;
const Suggestion = require('../models/suggestions');
const User = require("../models/user");
const SavedPublication = require("../models/savedPublication");
const sendNotification = require("../utils/notifications/notificationService");
const mongoose = require("mongoose");



//Importar modelos
const Publication = require("../models/publication");
const Story = require("../models/story");

//Impotar servicios
const followService = require("../services/followService");

//acciones de prueba 
const prueba_publication = (req, res) => {
    return res.status(200).json({
        message: 'mensaje enviado desde: publicationController.js'
    })
};


const save = async (req, res) => {
    try {
        const { text, title, subtitle, watchPublication, likes, suggested, isLiked, comments, likedBy, location } = req.body;

        if (!text) {
            return res.status(400).json({
                status: "error",
                message: "You must send a text message",
            });
        }

        let fileUrl = null;

        // Verificar si se envió un archivo correctamente
        if (req.file) {
            const file = req.file.originalname;
            const extension = file.split('.').pop().toLowerCase();

            // Validar extensión del archivo
            const validExtensions = ["jpg", "jpeg", "png", "gif", "mp4", "mov", "avi", "mkv"];
            if (!validExtensions.includes(extension)) {
                return res.status(400).json({
                    status: "error",
                    message: "File extension is invalid",
                });
            }

            console.log("Archivo recibido:", req.file.originalname);

            // Convert buffer to base64 for Cloudinary upload
            const base64File = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64File}`;

            // Subir archivo a Cloudinary solo si req.file.buffer es válido
            try {
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: "publications",
                    resource_type: extension === "mp4" || extension === "mov" ? "video" : "image", // ✅ Permitir videos
                });

                fileUrl = result.secure_url;
            } catch (uploadError) {
                console.error("Error al subir a Cloudinary:", uploadError);
                return res.status(500).json({
                    status: "error",
                    message: "Error uploading file to Cloudinary",
                });
            }
        }

        // Crear y guardar la publicación
        const newPublication = new Publication({
            user: req.user.id,
            text,
            file: fileUrl,
            title: title || "",
            subtitle: subtitle || "",
            watchPublication: watchPublication ?? true,
            likes: likes ?? 0,
            suggested: suggested ?? false,
            isLiked: isLiked ?? false,
            comments: comments || [],
            likedBy: likedBy || [],
            location: location || "",
        });

        const publicationStored = await newPublication.save();

        return res.status(200).json({
            status: "success",
            message: "The publication has been saved",
            publication: true,
        });

    } catch (err) {
        console.error("Error saving publication:", err);
        return res.status(500).json({
            status: "error",
            message: "Publication not saved",
            error: err.message || err,
            publication: false,
        });
    }
};




// Sacar una publicacion
const detail = async (req, res) => {
    try {
        // Sacar id de la publicacion de la url
        const publicationId = req.params.id;

        // Usar findById con async/await
        const publicationStored = await Publication.findById(publicationId);

        // Comprobar si la publicación existe
        if (!publicationStored) {
            return res.status(404).send({
                error: "error",
                message: "The publication does not exist",
            });
        }

        // Devolver respuesta
        return res.status(200).json({
            status: "success",
            message: "Show the post",
            publication: publicationStored,
        });
    } catch (error) {
        // Manejar errores
        return res.status(500).send({
            error: "error",
            message: "Failed to get the post",
        });
    }
};


// Eliminar una publicación
const remove = async (req, res) => {
    try {
        // Sacar el id de la publicación a eliminar
        const publicationId = req.params.id;

        // Eliminar la publicación usando findOneAndDelete
        const deletedPublication = await Publication.findOneAndDelete({
            user: req.user.id,
            _id: publicationId,
        });

        // Comprobar si se encontró y eliminó la publicación
        if (!deletedPublication) {
            return res.status(404).json({
                status: "error",
                message: "The publication does not exist or does not belong to the user",
            });
        }

        // Devolver respuesta
        return res.status(200).json({
            status: "success",
            message: "Post deleted",
            publication: publicationId,
        });
    } catch (error) {
        // Manejar errores
        return res.status(500).json({
            status: "error",
            message: "Failed to delete the post",
        });
    }
};


// Listar publicaciones de un usuario
const user = async (req, res) => {
    try {
        const userId = req.params.id;

        // Número de página
        let page = 1;
        if (req.params.page) {
            page = parseInt(req.params.page);
        }

        const itemsPerPage = 5;

        // Calcular el total de publicaciones del usuario
        const total = await Publication.countDocuments({ user: userId });

        // Buscar publicaciones con paginación
        const publications = await Publication.find({ user: userId })
            .sort({ createdAt: -1 }) // Ordenar por fecha de creación descendente
            .skip((page - 1) * itemsPerPage)
            .limit(itemsPerPage)
            .populate('user', '-password -__v -role -email') // Poblar el campo `user` excluyendo ciertos campos
            .exec();


        if (publications.length <= 0) {
            return res.status(404).send({
                status: "error",
                message: " No posts to show"
            })
        }


        // Devolver un resultado
        return res.status(200).json({
            status: "success",
            message: "Posts from a user's profile",
            user: req.user,
            page,
            total,
            pages: Math.ceil(total / itemsPerPage),
            publications,
        });
    } catch (error) {


        // Manejo de errores
        return res.status(500).json({
            status: "error",
            message: "Error getting the user's posts",
            error: error.message,
        });
    }
};


const media = (req, res) => {
    // Obtener el parámetro de consulta "file"
    const file = req.query.file;

    // Validar que se haya enviado el parámetro
    if (!file) {
        return res.status(400).json({
            status: "error",
            message: "File URL not provided"
        });
    }

    // Verificar que sea una URL válida
    if (!file.startsWith("https://") || !file.includes("cloudinary")) {
        return res.status(400).json({
            status: "error",
            message: "Invalid or unsupported URL"
        });
    }

    // Redirigir al archivo en Cloudinary
    return res.redirect(file);
};


const feed = async (req, res) => {
    try {
        const userId = req.user.id.toString(); // Asegurar que userId sea string

        // Buscar usuario logueado y obtener su rol
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        console.log("🛠 Usuario encontrado:", user);
        console.log("📌 Rol del usuario:", user.role);

        // Obtener los usuarios seguidos por el usuario logueado usando followService
        const followService = require("../services/followService");
        const { following } = await followService.followUserIds(userId);

        // Agregar el propio usuario al array de búsqueda
        const usersToFetch = [...following, userId];

        console.log("📌 Obteniendo publicaciones de:", usersToFetch);

        // Obtener publicaciones del usuario y de los que sigue
        const publications = await Publication.find({ user: { $in: usersToFetch } })
            .sort({ createdAt: -1 }) // Ordenar por fecha de creación DESCENDENTE
            .populate({
                path: "user",
                select: "-password -__v -createdAt",
            })
            .populate({
                path: "comments.user",
                select: "-password -__v -createdAt",
            });

        console.log("📄 Publicaciones encontradas:", publications.length);

        return res.status(200).json({
            status: "success",
            message: "List of posts in the feed",
            publications,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Feed posts not listed",
            error: error.message,
        });
    }
};








const likePublication = async (req, res) => {
    try {
        const { publicationId } = req.params;
        const userId = req.user.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // Buscar la publicación con datos del usuario y comentarios
        const publication = await Publication.findById(publicationId)
            .populate('user', 'username email name role image fcmToken')
            .populate('comments.user', 'username email name role image');

        if (!publication) {
            return res.status(404).json({ message: "Post not found" });
        }

        const userIndex = publication.likedBy.indexOf(userId);
        const isLiking = userIndex === -1;

        // Agregar o quitar el like
        if (isLiking) {
            publication.likedBy.push(userId);
            publication.likes += 1;
        } else {
            publication.likedBy.splice(userIndex, 1);
            publication.likes -= 1;
        }

        await publication.save();

        // ✅ Verificar si la publicación llegó a 40 likes y sugerirla si es necesario
        if (publication.likes >= 40 && !publication.suggested) {
            console.log("The post has reached 40 likes and has not yet been suggested.");

            // Comprobar si la publicación ya está en la colección "Suggestion"
            const existingSuggestion = await Suggestion.findOne({ publication: publication._id });

            if (!existingSuggestion) {
                console.log("An existing suggestion was not found, creating a new one.");

                // Crear la sugerencia con solo los campos necesarios
                const suggestionData = {
                    user: publication.user, // ID del usuario que creó la publicación
                    publication: publication._id, // ID de la publicación
                    createdAt: Date.now() // Fecha de creación
                };

                // Crear la sugerencia
                const suggestion = new Suggestion(suggestionData);

                // Guardar la sugerencia en la base de datos
                await suggestion.save();

                // Actualizar la publicación para marcarla como sugerida
                publication.suggested = true;
                await publication.save();
                console.log("Suggestion created and post marked as suggested.");
            }
        } else if (publication.likes >= 40) {
            console.log("The post already has a suggestion.");
        }

        // ✅ Enviar notificación solo si la publicación pertenece a otro usuario
        if (publication.user._id.toString() !== userId) {
            const user = await User.findById(userId).select("username");
            const fcmToken = publication.user.fcmToken;

            if (fcmToken) {
                const actionMessage = isLiking ? "liked" : "unliked";
                const notificationTitle = isLiking ? "New Like! ❤" : "Someone unliked your post 😢";
                const notificationBody = `${user.username} has ${actionMessage} your post.`;

                await sendNotification(fcmToken, notificationTitle, notificationBody, { postId: publicationId });
            }
        }

        // Convertir publicación en objeto para modificar campos antes de enviarlos
        const publicationObject = publication.toObject({ virtuals: true });

        // ✅ Asegurar que 'image' siempre tenga un valor
        if (!publicationObject.user.image || publicationObject.user.image.trim() === "") {
            publicationObject.user.image = null;
        }

        // ✅ Asegurar que 'image' en comentarios siempre tenga un valor
        publicationObject.comments.forEach(comment => {
            if (!comment.user.image || comment.user.image.trim() === "") {
                comment.user.image = null;
            }
        });

        publicationObject.isLiked = publication.likedBy.includes(userId);
        publicationObject.userId = userId;

        res.status(200).json({
            message: `Post successfully ${isLiking ? "liked" : "unliked"}`,
            publication: publicationObject,
        });
    } catch (error) {
        console.error("Error when liking:", error);
        res.status(500).json({ message: "Server Error" });
    }
};






// Método para agregar un comentario a una publicación
const addComment = async (req, res) => {
    try {
        const { publicationId } = req.params;
        const { text } = req.body;
        const userId = req.user.id;

        const newComment = {
            user: userId,
            text,
            createdAt: new Date()
        };

        const publication = await Publication.findByIdAndUpdate(
            publicationId,
            { $push: { comments: newComment } },
            { new: true }
        )
            .populate({
                path: 'comments.user',
                select: '-password'
            })
            .populate({
                path: 'user',
                select: '-password'
            });

        if (!publication) {
            return res.status(404).json({ message: "Post not found" });
        }

        res.status(200).json({
            message: "Comment added successfully",
        });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Server Error" });
    }
};





//Dashboard endpoint
// Obtener todas las publicaciones
const allPublications = async (req, res) => {
    try {
        console.log("📌 Buscando publicaciones...");

        // Verificar si el esquema de Publication tiene stories
        const publicationSchemaPaths = Object.keys(Publication.schema.paths);
        const hasStories = publicationSchemaPaths.includes("stories");

        let query = Publication.find()
            .populate({
                path: "user",
                select: "-password -token" // Excluir datos sensibles
            })
            .populate({
                path: "comments",
                populate: {
                    path: "user",
                    model: "User",
                    select: "-password -token" // Excluir datos sensibles en comentarios
                }
            });

        // Solo hacer populate de stories si existe en el esquema
        if (hasStories) {
            query = query.populate({
                path: "stories",
                model: "Story",
                populate: {
                    path: "user",
                    model: "User",
                    select: "-password -token"
                }
            });
        } else {
            console.warn("⚠ El campo 'stories' no existe en el esquema de Publication");
        }

        const data = await query;

        if (!data || data.length === 0) {
            console.warn("⚠ No se encontraron publicaciones");
            return res.status(404).send({
                error: "error",
                message: "No publications found",
            });
        }

        console.log("✅ Publicaciones encontradas:", data.length);

        return res.status(200).json({
            status: "success",
            message: "List of all publications",
            data: data,
        });
    } catch (error) {
        console.error("❌ Error al obtener publicaciones:", error);
        return res.status(500).send({
            error: "error",
            message: "Failed to retrieve publications",
            details: error.message
        });
    }
};



const toggleWatchPublication = async (req, res) => {
    try {
        const { publicationId } = req.params; // ID de la publicación

        // Buscar la publicación por ID
        const publication = await Publication.findById(publicationId);

        if (!publication) {
            return res.status(404).json({ message: "Publication not found" });
        }

        // Alternar el valor de watchPublication
        publication.watchPublication = !publication.watchPublication; // Invierte el valor actual
        await publication.save();

        res.status(200).json({
            message: `watchPublication updated to ${publication.watchPublication}`,
            watchPublication: publication.watchPublication
        });
    } catch (error) {
        console.error("Error toggling watchPublication:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

const updatePublication = async (req, res) => {
    try {
        console.log("📌 Request recibido en updatePublication");

        const publicationId = req.params.id;
        console.log("🆔 ID de publicación:", publicationId);
        console.log("📦 Request Body:", req.body);
        console.log("📂 Archivo recibido:", req.file);

        // Validar si el body está vacío
        if (Object.keys(req.body).length === 0 && !req.file) {
            return res.status(400).json({
                status: "error",
                message: "No data provided for update",
            });
        }

        // Buscar publicación
        let publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).json({
                status: "error",
                message: "Publication not found",
            });
        }

        console.log("🔹 Publicación actual encontrada:", publication);

        // Extraer datos del body
        const { text, title, subtitle, watchPublication, likes, suggested, isLiked, comments, likedBy } = req.body;

        // Manejo de imagen (si hay un archivo)
        let fileUrl = publication.file;
        if (req.file) {
            console.log("✅ Subiendo imagen a Cloudinary...");

            // Convert buffer to base64 for Cloudinary upload
            const base64File = req.file.buffer.toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${base64File}`;

            const result = await cloudinary.uploader.upload(dataURI, { folder: "publications" });

            fileUrl = result.secure_url;

            console.log("✅ Nueva imagen subida:", fileUrl);
        }

        // Actualizar los datos (sin modificar valores no enviados)
        publication.text = text || publication.text;
        publication.file = fileUrl;
        publication.title = title || publication.title;
        publication.subtitle = subtitle || publication.subtitle;
        publication.watchPublication = watchPublication || publication.watchPublication;
        publication.likes = likes || publication.likes;
        publication.suggested = suggested || publication.suggested;
        publication.isLiked = isLiked || publication.isLiked;
        publication.comments = comments || publication.comments;
        publication.likedBy = likedBy || publication.likedBy;

        // Guardar cambios
        await publication.save();

        console.log("✅ Publicación actualizada correctamente:", publication);

        return res.status(200).json({
            status: "success",
            message: "The publication has been updated",
            publication,
        });

    } catch (err) {
        console.error("❌ Error updating publication:", err);
        return res.status(500).json({
            status: "error",
            message: "Publication not updated",
            error: err.message || err,
        });
    }
};


const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar en ambas colecciones
        const story = await Story.findById(id);
        if (story) {
            await Story.findByIdAndDelete(id);
            return res.status(200).json({ message: "Story deleted successfully" });
        }

        const publication = await Publication.findById(id);
        if (publication) {
            await Publication.findByIdAndDelete(id);
            return res.status(200).json({ message: "Publication deleted successfully" });
        }

        return res.status(404).json({ message: "Item not found" });
    } catch (error) {
        console.error("❌ Error deleting item:", error);
        return res.status(500).json({ error: "Server error" });
    }
};





//Expoortar las acciones
module.exports = {
    prueba_publication,
    save,
    detail,
    remove,
    user,
    media,
    feed,
    likePublication,
    addComment,
    allPublications,
    toggleWatchPublication,
    updatePublication,
    deleteItem
};