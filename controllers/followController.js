const Follow = require('../models/follow');
const user = require('../models/user');
const User = require('../models/user');

//Importar  servicio
const followService = require('../services/followService');

//acciones de prueba 
const prueba_follow = (req, res) => {
    return res.status(200).json({
        message: 'mensaje enviado desde: userController.js'
    })
};

//Accion de guardar un follow
const save = async (req, res) => {
    try {
        // Conseguir datos por body
        const params = req.body;

        // Sacar el usuario del id identificado
        const identity = req.user;

        // Crear objeto con modelo Follow
        const user_follow = new Follow({
            user: identity.id,
            followed: params.followed
        });

        // Guardar en la BD
        const followStored = await user_follow.save();

        // Devolver respuesta exitosa
        return res.status(200).json({
            status: 'success',
            message: 'Follow registrado con éxito',
            identity: req.user,
            user: followStored
        });
    } catch (error) {
        // Manejar errores
        return res.status(500).json({
            status: 'error',
            message: 'El follow no se ha guardado',
            error: error.message
        });
    }
};


const unfollow = async (req, res) => {
    try {
        // Sacar el id del usuario identificado
        const userId = req.user.id;

        // Sacar el id del usuario que se quiere dejar de seguir
        const followedId = req.params.id;

        // Eliminar el follow con esos parámetros
        const result = await Follow.deleteOne({ user: userId, followed: followedId });

        // Comprobar si se eliminó algo
        if (result.deletedCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'El follow no existe o ya fue eliminado'
            });
        }

        // Respuesta exitosa
        return res.status(200).json({
            status: 'success',
            message: 'Follow eliminado correctamente',
        });
    } catch (err) {
        // Manejo de errores
        return res.status(500).json({
            status: 'error',
            message: 'Error al intentar eliminar el follow',
            error: err.message
        });
    }
};


const following = async (req, res) => {
    try {
        let userId = req.user.id;

        // Comprobar si me llega el parámetro en la URL
        if (req.params.id) userId = req.params.id;

        // Comprobar si me llega la página
        let page = parseInt(req.params.page) || 1;

        // Cuántos usuarios por página quiero mostrar
        const itemsPerPage = 5;

        // Buscar los follows con paginación
        const options = {
            page,
            limit: itemsPerPage,
            populate: [
                { path: "user", select: "-role -password -createdAt -__v -email" },
                { path: "followed", select: "-role -password -createdAt -__v -email" },
            ],
            sort: { createdAt: -1 }, // Ordenar por fecha de creación (opcional)
        };

        const result = await Follow.paginate({ user: userId }, options);

        let followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).json({
            status: "success",
            message: "Los que sigo",
            follows: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        console.error("Error en la función following:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener los follows",
            error: error,
        });
    }
};





//Accion de listar los que me siguen
const followers = async (req, res) => {
    try {
        let userId = req.user.id;

        // Comprobar si me llega el parámetro en la URL
        if (req.params.id) userId = req.params.id;

        // Comprobar si me llega la página
        let page = parseInt(req.params.page) || 1;

        // Cuántos usuarios por página quiero mostrar
        const itemsPerPage = 5;

        // Buscar los follows con paginación
        const options = {
            page,
            limit: itemsPerPage,
            populate: [
                { path: "user", select: "-role -password -createdAt" },
                { path: "followed", select: "-role -password -createdAt" },
            ],
            sort: { createdAt: -1 }, // Ordenar por fecha de creación (opcional)
        };

        const result = await Follow.paginate({ followed: userId }, options);    

        let followUserIds = await followService.followUserIds(req.user.id);

        return res.status(200).json({
            status: "success",
            message: "Listado de usuario que me siguen",
            follows: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        console.error("Error en la función following:", error);
        return res.status(500).json({
            status: "error",
            message: "Error al obtener los follows",
            error: error,
        });
    }
}


//Expoortar las acciones
module.exports = {
    prueba_follow,
    save,
    unfollow,
    followers,
    following
};

