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

const toggleFollow = async (req, res) => {
    try {
        const userId = req.user.id;
        const followedId = req.body.followed; // Usuario al que se quiere seguir/dejar de seguir

        // Verificar si ya existe el follow
        const existingFollow = await Follow.findOne({ user: userId, followed: followedId });

        if (existingFollow) {
            // Si ya sigue al usuario, eliminar el follow
            await Follow.deleteOne({ _id: existingFollow._id });

            return res.status(200).json({
                status: 'success',
                message: 'Follow removed successfully',
                isFollowing: false
            });
        } else {
            // Si no lo sigue, crear el follow
            const newFollow = new Follow({ user: userId, followed: followedId });
            await newFollow.save();

            return res.status(200).json({
                status: 'success',
                message: 'Follow Registered Successfully',
                isFollowing: true
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error toggling follow status',
            error: error.message
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
            message: "The ones I follow",
            follows: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        console.error("Following function error:", error);
        return res.status(500).json({
            status: "error",
            message: "Error getting the follows",
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
            message: "List of users who follow me",
            follows: result.docs,
            total: result.totalDocs,
            totalPages: result.totalPages,
            currentPage: result.page,
            user_following: followUserIds.following,
            user_follow_me: followUserIds.followers
        });
    } catch (error) {
        console.error("Following function error:", error);
        return res.status(500).json({
            status: "error",
            message: "Error getting the follows",
            error: error,
        });
    }
}


//Expoortar las acciones
module.exports = {
    prueba_follow,
    toggleFollow,
    followers,
    following
};

