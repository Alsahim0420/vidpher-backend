// Importar dependencias
const bcrypt = require("bcryptjs");
const Follow = require("../models/follow")
const Publication = require("../models/publication")
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary-config');


//Importar modulos
const user = require('../models/user');

//Importar servicios
const jwt = require('../services/jwt');
const followServices = require("../services/followService");
const validate = require("../helpers/validate");


// Función para generar un código OTP
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Código de 4 dígitos
};


//acciones de prueba 
const prueba_user = (req, res) => {
    return res.status(200).json({
        message: 'mensaje enviado desde: userController.js',
        usuario: req.user
    })
};

// Registro de usuarios
const register = async (req, res) => {
    // Recoger datos de la petición
    const params = req.body;
    console.log(params);

    // Validación básica
    if (!params.username || !params.password || !params.email || !params.role) {
        return res.status(400).json({
            status: 'error',
            message: 'There is still data to send',
        });
    }

    try {
        // Validación avanzada
        validate.validate(params);

        // Convertir email y username a minúsculas para consistencia
        const emailLower = params.email;
        const usernameLower = params.username;

        // Verificar si el usuario o email ya existen
        const existingUser = await user.findOne({
            $or: [
                { email: emailLower },
                { username: usernameLower },
            ],
        });

        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'The username or email address is already registered',
            });
        }

        // Encriptar contraseña
        const hashedPassword = bcrypt.hashSync(params.password, 10);
        params.password = hashedPassword;

        // Crear y guardar el nuevo usuario
        const user_obj = new user(params);
        const userStored = await user_obj.save();

        return res.status(201).json({
            status: 'success',
            message: 'Successfully registered user',
            user: userStored,
        });
    } catch (error) {
        // Manejar errores de validación
        if (error.message === 'No se ha superado la validacion') {
            return res.status(400).json({
                status: 'error',
                message: error.message,
            });
        }

        // Manejar otros errores
        return res.status(500).json({
            status: 'error',
            message: 'User query or user save failed',
            error: error.message,
        });
    }
};





const login = async (req, res) => {
    // Recoger los parámetros
    const params = req.body;

    // Validar los datos recibidos
    if (!params.username || !params.password) {
        console.log(params.username);
        return res.status(400).json({
            status: 'error',
            message: 'There is still data to send'
        });
    }

    try {
        // Buscar el usuario en la base de datos
        const userFound = await user
            .findOne({ username: params.username })
            .select('username email role image');

        // Si el usuario no existe
        if (!userFound) {
            return res.status(400).json({
                status: 'error',
                message: 'The user does not exist'
            });
        }

        // Comprobar la contraseña con bcrypt
        const isPasswordValid = bcrypt.compareSync(params.password, userFound.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Incorrect password'
            });
        }

        // Generar y devolver el token (opcional, según tu implementación)
        const token = jwt.createToken(userFound);


        // Respuesta exitosa
        return res.status(200).json({
            status: 'success',
            message: 'Correct login',
            user: userFound,
            token: token
        });
    } catch (error) {
        // Manejo de errores
        return res.status(500).json({
            status: 'error',
            message: 'Server Error',
            error: error.message,
        });
    }
};


const profile = async (req, res) => {
    try {
        // Recibir el parámetro
        const id = req.params.id;

        // Buscar al usuario por ID
        const userFound = await user.findById(id)
            .select({ password: 0, role: 0, otp: 0 });

        // Validar si el usuario no existe
        if (!userFound) {
            return res.status(404).send({
                status: 'error',
                message: 'User Not Found'
            });
        }


        //Informacion del seguimiento
        const followInfo = await followServices.followThisUser(req.user.id, id);

        // Devolver el resultado
        return res.status(200).send({
            status: 'success',
            user: userFound,
            followinfo: followInfo.following,
            followr: followInfo.followers
        });

    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Query Error',
            error: err.message
        });
    }
};

const list = async (req, res) => {
    try {
        // Página actual
        let page = parseInt(req.params.page) || 1;

        // Número de elementos por página
        const itemsPerPage = 5;

        // Paginación de usuarios con selección de campos
        const result = await user.paginate(
            {}, // Consulta vacía para listar todos los usuarios
            {
                page,
                limit: itemsPerPage,
                sort: { _id: 1 }, // Ordenar por ID ascendente
                select: "-password -email -role -__v", // Excluir campos sensibles
            }
        );

        // Verificar si hay usuarios
        if (!result.docs || result.docs.length === 0) {
            return res.status(404).send({
                status: "error",
                message: "Users not found",
            });
        }

        // Obtener IDs de los usuarios que sigo y que me siguen
        const followUserIds = await followServices.followUserIds(req.user.id);

        return res.status(200).send({
            status: "success",
            message: "List of users",
            page: result.page,
            itemsPerPage: result.limit,
            total: result.totalDocs,
            totalPages: result.totalPages,
            users: result.docs, // Lista de usuarios paginada
            user_following: followUserIds.following, // Usuarios que sigo
            user_follow_me: followUserIds.followers, // Usuarios que me siguen
            followersCount: followUserIds.followersCount, // Cantidad de seguidores
        });
    } catch (error) {
        console.error("List function error:", error);
        return res.status(500).send({
            status: "error",
            message: "Error obtaining the list of users",
            error: error.message || "Unknown error",
        });
    }
};



const update = async (req, res) => {
    // Recoger información del usuario
    const user_identity = req.user; // Usuario autenticado
    const user_update = req.body; // Datos enviados desde el cliente
    console.log(user_update);

    // Eliminar campos sobrantes
    delete user_update.iat;
    delete user_update.exp;
    delete user_update.rol;
    delete user_update.image;

    // Validar si los datos necesarios están presentes
    if (!user_update.email || !user_update.username) {
        return res.status(400).json({
            status: "error",
            message: "Email and username are required",
        });
    }

    try {
        // Comprobar si el usuario ya existe
        const users = await user.find({
            $or: [
                { email: user_update.email.toLowerCase() },
                { username: user_update.username.toLowerCase() },
            ],
        });

        let userIsset = false;
        users.forEach((user) => {
            if (user && user._id.toString() !== user_identity.id) {
                userIsset = true;
            }
        });

        if (userIsset) {
            return res.status(400).json({
                status: "error",
                message: "User is already registered",
            });
        }

        // Encriptar contraseña si está presente en los datos de actualización
        if (user_update.password) {
            const hashedPassword = bcrypt.hashSync(user_update.password, 10);
            user_update.password = hashedPassword;
        }else[
            delete user_update.password
        ]

        // Actualizar usuario
        const updatedUser = await user.findByIdAndUpdate(
            user_identity.id,
            user_update,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                status: "error",
                message: "User Not Found",
            });
        }

        return res.status(200).json({
            status: "success",
            message: "User Updated Successfully",
            user: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "User query or user refresh failed",
            error: error.message,
        });
    }
};

const updateAvatar = async (userId, avatarUrl) => {
    try {
        // Buscar y actualizar al usuario con la URL del avatar
        const updatedUser = await user.findByIdAndUpdate(
            userId, // Filtro por el ID del usuario
            { image: avatarUrl }, // Campo a actualizar
            { new: true } // Devuelve el documento actualizado
        );

        if (!updatedUser) {
            throw new Error('User not found to update avatar');
        }

        return updatedUser;
    } catch (error) {
        console.error('Error updating avatar:', error.message);
        throw error;
    }
};


const upload = async (req, res) => {
    try {
        // Verifica que se haya subido un archivo
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded." });
        }

        // Subir archivo a Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'avatars', // Carpeta opcional en Cloudinary
        });

        // Eliminar archivo temporal
        fs.unlinkSync(req.file.path);

        // Llama al controlador para actualizar el usuario con la URL del avatar
        const updatedUser = await user.updateAvatar(req.user.id, result.secure_url);

        res.status(200).json({
            message: "Avatar uploaded successfully.",
            avatarUrl: result.secure_url,
            user: updatedUser,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error uploading avatar." });
    }
};

const avatar = (req, res) => {
    // Sacar el parámetro
    const file = req.params.file;

    // Montar el path real de la imagen
    const filePath = path.resolve('./uploads/avatars/' + file);

    // Comprobar si el archivo existe
    fs.stat(filePath, (error) => {
        if (error) {
            // Si el archivo no existe
            return res.status(404).json({
                status: "error",
                message: "The image does not exist"
            });
        }

        // Si existe, devolver el archivo
        return res.sendFile(filePath);
    });
};

const counters = async (req, res) => {
    // Obtener el ID del usuario desde el token o los parámetros
    let userId = req.user.id;

    if (req.params.id) {
        userId = req.params.id;
    }

    try {
        // Contar los documentos relacionados al usuario
        const following = await Follow.countDocuments({ user: userId });
        const followed = await Follow.countDocuments({ followed: userId });
        const publications = await Publication.countDocuments({ user: userId });

        // Responder con los contadores
        return res.status(200).json({
            userId,
            following,
            followed,
            publications
        });
    } catch (err) {
        // Capturar y responder con el error detallado
        console.error("Error in counters:", err); // Para depuración
        return res.status(500).json({
            status: "error",
            message: "Internal Server Error",
            error: err.message || "Unknown error"
        });
    }
};



// Endpoint para solicitar la recuperación de contraseña
const requestPasswordReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Buscar al usuario por email
        const foundUser = await user.findOne({ email });
        if (!foundUser) {
            return res.status(404).json({ message: 'User Not Found' });
        }

        // Generar el OTP y guardarlo en el usuario
        const otp = generateOtp();
        foundUser.otp = otp;
        await foundUser.save();

        // Aquí podrías enviar el OTP por correo electrónico (usando nodemailer, por ejemplo)
        console.log(`OTP generado: ${otp}`); // En producción, no expongas el OTP en los logs

        return res.status(200).json({ message: 'OTP sent. Check your email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        // Buscar al usuario por email y verificar el OTP
        const foundUser = await user.findOne({ email, otp });
        if (!foundUser) {
            return res.status(400).json({
                message: 'Incorrect OTP or User Not Found',
                user: foundUser
            });
        }

        // Validar email y contraseña
        validate.validate({ email, password: newPassword });

        // Encriptar contraseña
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        foundUser.password = hashedPassword;

        // Limpiar el OTP después de usarlo
        foundUser.otp = null;
        await foundUser.save();

        return res.status(200).json({
            message: 'Successfully updated password',
            user: foundUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};




//Expoortar las acciones
module.exports = {
    prueba_user,
    register,
    login,
    profile,
    list,
    update,
    upload,
    avatar,
    counters,
    requestPasswordReset,
    resetPassword,
    updateAvatar,
};