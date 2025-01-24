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

        // Si no llegan datos, enviar respuesta negativa
        if (!params.text) {
            return res.status(400).send({
                error: "error",
                message: "Debes enviar un mensaje de texto",
            });
        }

        // Crear y rellenar el objeto del modelo
        const newPublication = new Publication(params);
        newPublication.user = req.user.id;

        // Guardar en la base de datos
        const publicationStored = await newPublication.save();

        return res.status(200).json({
            status: "success",
            message: "La publicación ha sido guardada",
            publicationStored,
        });
    } catch (error) {
        console.error("Error al guardar la publicación:", error);
        return res.status(500).send({
            error: "error",
            message: "No se ha guardado la publicación",
            details: error.message,
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
                message: "La publicacion no existe",
            });
        }

        // Devolver respuesta
        return res.status(200).json({
            status: "success",
            message: "Mostrar la publicacion",
            publication: publicationStored,
        });
    } catch (error) {
        // Manejar errores
        return res.status(500).send({
            error: "error",
            message: "Error al obtener la publicacion",
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
                message: "La publicación no existe o no pertenece al usuario",
            });
        }

        // Devolver respuesta
        return res.status(200).json({
            status: "success",
            message: "Publicación eliminada",
            publication: publicationId,
        });
    } catch (error) {
        // Manejar errores
        return res.status(500).json({
            status: "error",
            message: "Error al eliminar la publicación",
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
                message: " No hay publicaciones para mostrar"
            })
        }


        // Devolver un resultado
        return res.status(200).json({
            status: "success",
            message: "Publicaciones del perfil de un usuario",
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
            message: "Error al obtener las publicaciones del usuario",
            error: error.message,
        });
    }
};


const upload = async (req, res) => {
    try {
        // Obtener publicationId desde los parámetros
        const publicationId = req.params.id;

        console.log('Publication ID:', publicationId);
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
            folder: 'publications', // Carpeta opcional en Cloudinary
        });

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);

        // Actualizar la publicación con la URL de la imagen almacenada en Cloudinary
        const publicationUpdated = await Publication.findOneAndUpdate(
            { user: req.user.id, _id: publicationId }, // Filtro
            { file: result.secure_url }, // Datos a actualizar
            { new: true } // Devolver el documento actualizado
        );

        if (!publicationUpdated) {
            return res.status(404).json({
                status: "error",
                message: "No se encontró la publicación para actualizar la imagen",
            });
        }

        // Responder con éxito
        return res.status(200).json({
            status: "success",
            message: "Subida de imagen exitosa",
            publication: publicationUpdated,
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


const media = (req, res) => {
    // Obtener el parámetro de consulta "file"
    const file = req.query.file;

    // Validar que se haya enviado el parámetro
    if (!file) {
        return res.status(400).json({
            status: "error",
            message: "No se ha proporcionado la URL del archivo"
        });
    }

    // Verificar que sea una URL válida
    if (!file.startsWith("https://") || !file.includes("cloudinary")) {
        return res.status(400).json({
            status: "error",
            message: "URL no válida o no compatible"
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
            message: "Lista de publicaciones en el feed",
            myFollows: myFollows.following,
            total: publications.totalDocs,
            page: publications.page,
            pages: publications.totalPages,
            publications: publications.docs, // Publicaciones
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "No se han listado las publicaciones del feed",
            error: error.message,
        });
    }
};


const likePublication = async (req, res) => {
    try {
        const { publicationId } = req.params;

        // Buscar la publicación y aumentar el contador de "likes"
        const publication = await Publication.findByIdAndUpdate(
            publicationId,
            { $inc: { likes: 1 } }, // Incrementar el contador
            { new: true } // Retornar el documento actualizado
        );

        if (!publication) {
            return res.status(404).json({ message: "Publicación no encontrada" });
        }

        console.log("Likes después de incrementar:", publication.likes);

        // Verificar si la publicación llegó a 40 likes
        if (publication.likes >= 40 && !publication.suggested) {
            console.log("La publicación ha alcanzado 40 likes y no ha sido sugerida aún.");

            // Comprobar si la publicación ya está en la colección "Suggestion"
            const existingSuggestion = await Suggestion.findOne({ originalPublicationId: publication._id });

            if (!existingSuggestion) {
                console.log("No se encontró una sugerencia existente, creando una nueva.");

                // Validar campos de la publicación antes de crear la sugerencia
                const suggestionData = {
                    text: publication.text || "Texto no disponible", // Campo obligatorio
                    user: publication.user || null, // Asegurarse de que el autor esté presente
                    createdAt: publication.createdAt || Date.now(), // Fecha de creación
                    likes: publication.likes,
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
                console.log("Sugerencia creada y publicación marcada como sugerida.");
            }
        } else if (publication.likes >= 40) {
            // Si la sugerencia ya existe, actualiza los datos (likes)
            const existingSuggestion = await Suggestion.findOne({ originalPublicationId: publication._id });

            if (existingSuggestion) {
                // Actualizar los likes de la sugerencia con los de la publicación
                existingSuggestion.likes = publication.likes;
                await existingSuggestion.save();
                console.log("Sugerencia actualizada con nuevos likes:", existingSuggestion);
            }
        }

        res.status(200).json({ message: "Like agregado con éxito", publication });
    } catch (error) {
        console.error("Error al dar like:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};





// Método para quitar el like de una publicación
const dislikePublication = async (req, res) => {
    try {
        const { publicationId } = req.params;

        // Buscar la publicación
        const publication = await Publication.findById(publicationId);

        if (!publication) {
            return res.status(404).json({ message: "Publicación no encontrada" });
        }

        // Verificar si el arreglo likedBy está definido, de lo contrario, inicializarlo
        if (!publication.likedBy) {
            publication.likedBy = [];
        }

        // Decrementar el contador de "likes" y eliminar el primer "like" encontrado
        publication.likes = Math.max(publication.likes - 1, 0); // Evitar que los "likes" sean negativos
        publication.likedBy.pop(); // Eliminar el último "like" dado
        await publication.save();

        res.status(200).json({ message: "Like eliminado con éxito", publication });
    } catch (error) {
        console.error("Error al eliminar el like:", error);
        res.status(500).json({ message: "Error en el servidor" });
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
            return res.status(404).json({ message: "Publicación no encontrada" });
        }

        // Verificar si la publicación ha superado los 40 likes
        if (publication.likes >= 40 && !publication.suggested) {
            // Comprobar si la publicación ya está en la colección "Suggestion"
            const existingSuggestion = await Suggestion.findOne({ originalPublicationId: publication._id });

            if (!existingSuggestion) {
                // Validar campos de la publicación antes de crear la sugerencia
                const suggestionData = {
                    text: publication.text || "Texto no disponible", // Campo obligatorio
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
                console.log("Sugerencia actualizada con nuevos comentarios:", existingSuggestion);
            }
        }

        res.status(200).json({ message: "Comentario agregado con éxito", publication });
    } catch (error) {
        console.error("Error al agregar el comentario:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};


module.exports = { addComment };


//Expoortar las acciones
module.exports = {
    prueba_publication,
    save,
    detail,
    remove,
    user,
    upload,
    media,
    feed,
    likePublication,
    addComment,
    dislikePublication
};