//Importar modulos 
const fs = require("fs");
const path = require("path");
const cloudinary = require('../config/cloudinary-config');
const Suggestion = require('../models/suggestions');


//Importar modelos
const Publication = require("../models/publication");

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
        // Recoger datos del body
        const params = req.body;

        // Verificar que el texto está presente
        if (!params.text) {
            return res.status(400).json({
                status: "error",
                message: "You must send a text message",
            });
        }

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
                await fs.unlinkSync(req.file.path); // Eliminar archivo no válido
            } catch (err) {
                return res.status(500).json({
                    status: "error",
                    message: "Failed to delete invalid file",
                    error: err.message || err,
                });
            }

            return res.status(400).json({
                status: "error",
                message: "File extension is invalid",
            });
        }

        // Subir archivo a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'publications', // Carpeta opcional en Cloudinary
        });

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);

        // Crear y rellenar el objeto del modelo
        const newPublication = new Publication({
            text: params.text,
            file: result.secure_url, // URL de la imagen
            user: req.user.id, // Usuario que crea la publicación
        });

        // Guardar en la base de datos
        const publicationStored = await newPublication.save();

        // Responder con éxito
        return res.status(200).json({
            status: "success",
            message: "The publication has been saved",
            publication: publicationStored,
        });

    } catch (err) {
        console.error("Error saving publication:", err);
        return res.status(500).json({
            status: "error",
            message: "Publication not saved",
            error: err.message || err,
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
        // Sacar el id del usuario
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
    // Página actual
    let page = parseInt(req.params.page) || 1;

    // Número de elementos por página
    const itemsPerPage = 5;

    try {
        // Obtener los usuarios que sigue el usuario actual
        const myFollows = await followService.followUserIds(req.user.id);

        // Buscar publicaciones con paginación
        const options = {
            page,
            limit: itemsPerPage,
            sort: { createdAt: -1 }, // Ordenar por fecha de creación descendente
            populate: {
                path: "user",
                select: "-password -role -__v -email", // Excluir campos sensibles
            },
        };

        const publications = await Publication.paginate(
            { user: { $in: myFollows.following } }, // Filtrar por usuarios seguidos
            options
        );

        // Responder con los datos
        return res.status(200).json({
            status: "success",
            message: "List of posts in the feed",
            myFollows: myFollows.following,
            total: publications.totalDocs,
            page: publications.page,
            pages: publications.totalPages,
            publications: publications.docs, // Publicaciones
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
        const userId = req.user.id; // Asumiendo que el ID del usuario está en el token

        // Buscar la publicación
        const publication = await Publication.findById(publicationId);

        if (!publication) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Verificar si el usuario ya dio like
        const userIndex = publication.likedBy.indexOf(userId);

        if (userIndex === -1) {
            // Si el usuario no ha dado like, agregarlo a la lista
            publication.likedBy.push(userId);
            publication.likes += 1; // Incrementar el contador de likes
        } else {
            // Si el usuario ya dio like, eliminarlo de la lista
            publication.likedBy.splice(userIndex, 1);
            publication.likes -= 1; // Decrementar el contador de likes
        }

        // Guardar la publicación actualizada
        await publication.save();

        console.log("Likes después de la acción:", publication.likes);

        // Verificar si la publicación llegó a 40 likes
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
            // Si la sugerencia ya existe, no es necesario hacer nada adicional
            console.log("The post already has a suggestion.");
        }

        res.status(200).json({ message: "Like toggled successfully", publication });
    } catch (error) {
        console.error("Error when liking:", error);
        res.status(500).json({ message: "Server Error" });
    }
};






// Método para agregar un comentario a una publicación
const addComment = async (req, res) => {
    try {
        const { publicationId } = req.params; // ID de la publicación
        const { text } = req.body; // Texto del comentario
        const userId = req.user.id; // ID del usuario

        // Buscar la publicación por ID y agregar el comentario
        const publication = await Publication.findByIdAndUpdate(
            publicationId,
            { $push: { comments: { user: userId, text } } }, // Agrega el comentario al array
            { new: true } // Retorna el documento actualizado
        );

        if (!publication) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Verificar si la publicación ha superado los 40 likes
        if (publication.likes >= 40 && !publication.suggested) {
            // Comprobar si la publicación ya está en la colección "Suggestion"
            const existingSuggestion = await Suggestion.findOne({ originalPublicationId: publication._id });

            if (!existingSuggestion) {
                // Validar campos de la publicación antes de crear la sugerencia
                const suggestionData = {
                    text: publication.text || "Text not available", // Campo obligatorio
                    user: publication.user || null, // Asegurarse de que el autor esté presente
                    createdAt: publication.createdAt || Date.now(), // Fecha de creación
                    likes: publication.likes,
                    comments: publication.comments, // Obtener los comentarios de la publicación
                    originalPublicationId: publication._id,
                    // Agregar otros campos relevantes
                };

                // Crear la sugerencia
                const suggestion = new Suggestion(suggestionData);

                // Guardar la sugerencia en la base de datos
                await suggestion.save();

                // Actualizar la publicación para marcarla como sugerida
                publication.suggested = true;
                await publication.save();
            }
        } else if (publication.likes >= 40) {
            // Si la sugerencia ya existe, actualizar los comentarios en la sugerencia
            const existingSuggestion = await Suggestion.findOneAndUpdate(
                { originalPublicationId: publication._id },
                { comments: publication.comments }, // Actualizar los comentarios
                { new: true } // Retornar el documento actualizado
            );

            if (existingSuggestion) {
                console.log("Updated suggestion with new comments:", existingSuggestion);
            }
        }

        res.status(200).json({ message: "Comment added successfully", publication });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Server Error" });
    }
};



//Dashboard endpoint

// Obtener todas las publicaciones
const allPublications = async (req, res) => {
    try {
        // Buscar todas las historias en la base de datos
        const publications = await Publication.find();

        // Comprobar si hay historias
        if (!publications || publications.length === 0) {
            return res.status(404).send({
                error: "error",
                message: "No stories found",
            });
        }

        // Devolver respuesta con las historias
        return res.status(200).json({
            status: "success",
            message: "List of all stories",
            stories: publications,
        });
    } catch (error) {
        // Manejar errores
        return res.status(500).send({
            error: "error",
            message: "Failed to retrieve stories",
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
            publication 
        });
    } catch (error) {
        console.error("Error toggling watchPublication:", error);
        res.status(500).json({ message: "Server Error" });
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
    toggleWatchPublication
};