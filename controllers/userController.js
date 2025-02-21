// Importar dependencias
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary-config');


//Importar modulos
const user = require('../models/user');
const SavedPublication = require('../models/savedPublication');
const Publication = require("../models/publication")
const Follow = require("../models/follow")
const Preferences = require('../models/preferences');
const Suggestions = require('../models/suggestions');

//Importar servicios
const jwt = require('../services/jwt');
const followServices = require("../services/followService");
const validate = require("../helpers/validate");
const nodemailer = require('nodemailer');

// Configura el transporter (aquí usamos Gmail como ejemplo)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'vidpherotp@gmail.com', // Tu dirección de correo electrónico
        pass: 'Vidpher123#' // Tu contraseña de correo electrónico
    }
});

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

const register = async (req, res) => {
    // Recoger datos de la petición
    const params = req.body;
    console.log(params);

    // Validación básica
    if (!params.username || !params.password || !params.email || !params.role || !params.name) {
        return res.status(400).json({
            status: 'error',
            message: 'There is still data to send. Please provide name, username, password, email, and role.',
        });
    }

    try {
        // Validación avanzada
        validate.validate(params);

        // Convertir email y username a minúsculas para consistencia
        const emailLower = params.email.toLowerCase();
        const usernameLower = params.username.toLowerCase();

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

        // Crear y guardar el nuevo usuario con una bio por defecto
        const user_obj = new user({
            name: params.name,
            username: usernameLower,
            email: emailLower,
            password: params.password,
            role: params.role,
            bio: params.bio || "Hello! I'm new here.", // Bio por defecto
        });

        const userStored = await user_obj.save();

        // Generar token JWT para loguear al usuario
        const token = jwt.createToken(userStored);

        // Responder con el usuario registrado y el token
        return res.status(201).json({
            status: 'success',
            message: 'Successfully registered and logged in',
            user: userStored,
            token, // Enviar el token al cliente
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
    const { identifier, password } = req.body;

    // Validar los datos recibidos
    if (!identifier || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Identifier and password are required'
        });
    }

    try {
        // Buscar el usuario en la base de datos por username, email o name
        const userFound = await user
            .findOne({
                $or: [
                    { username: identifier },
                    { email: identifier },
                    { name: identifier }
                ]
            })
            .select('username email password role image name bio fcmToken');

        // Si el usuario no existe
        if (!userFound) {
            return res.status(400).json({
                status: 'error',
                message: 'The user does not exist'
            });
        }

        if (!userFound.password) {
            return res.status(500).json({
                status: 'error',
                message: 'Password field is missing for this user'
            });
        }

        // Comprobar la contraseña con bcrypt
        const isPasswordValid = bcrypt.compareSync(password, userFound.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Incorrect password'
            });
        }

        // Generar el token
        const token = jwt.createToken(userFound);

        // Responder solo con la información del usuario y el token
        return res.status(200).json({
            status: 'success',
            message: 'Correct login',
            user: userFound,
            token: token
        });
    } catch (error) {
        // Manejo de errores
        console.error("Error in login:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Server Error',
            error: error.message
        });
    }
};


const profile = async (req, res) => {
    try {
        const id = req.params.id;

        // Buscar al usuario por ID y obtener su tipo
        const userFound = await user.findById(id)
            .select({ password: 0, otp: 0 });

        if (!userFound) {
            return res.status(404).send({
                status: 'error',
                message: 'User Not Found'
            });
        }

        const followInfo = await followServices.followThisUser(req.user.id, id);
        const following = await Follow.countDocuments({ user: id });
        const followed = await Follow.countDocuments({ followed: id });
        const publicationsCount = await Publication.countDocuments({ user: id });

        let publications = [];

        if (userFound.role === 2) { 
            publications = await Publication.find({ user: id })
                .select('file likes likedBy comments createdAt user watchPublication')
                .sort({ createdAt: -1 })
                .populate({
                    path: 'comments.user',
                    select: '-password'
                })
                .populate({
                    path: 'user',
                    select: '-password -otp'
                });
        } else if (userFound.role === 3) {
            const savedPublications = await SavedPublication.find({ user: id })
                .populate({ path: 'publication', populate: { path: 'user', select: '-password -otp' } });

            publications = savedPublications.map(saved => saved.publication);
        }

        const userId = req.user.id;
        const publicationsWithLikes = publications.map(publication => {
            publication._locals = { userId };
            return publication.toObject({ virtuals: true });
        });

        return res.status(200).send({
            status: 'success',
            user: userFound,
            counters: {
                following,
                followed,
                publications: publicationsCount
            },
            publications: publicationsWithLikes 
        });

    } catch (err) {
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
    const user_identity = req.user;
    const user_update = req.body;
    console.log(user_update);

    // Eliminar campos sobrantes
    delete user_update.iat;
    delete user_update.exp;
    delete user_update.rol;
    delete user_update.image;

    try {
        // Obtener el usuario actual
        const existingUser = await user.findById(user_identity.id);
        if (!existingUser) {
            return res.status(404).json({
                status: "error",
                message: "User Not Found",
            });
        }

        // Mantener los valores actuales si no se envían en la petición
        Object.keys(existingUser._doc).forEach(key => {
            if (!user_update[key]) {
                user_update[key] = existingUser[key];
            }
        });

        // Comprobar si el email ya está en uso por otro usuario
        if (user_update.email) {
            const existingEmailUser = await user.findOne({ email: user_update.email.toLowerCase() });
            if (existingEmailUser && existingEmailUser._id.toString() !== user_identity.id) {
                return res.status(400).json({
                    status: "error",
                    message: "Email is already registered",
                });
            }
        }

        // Guardar cambios
        const updatedUser = await user.findByIdAndUpdate(user_identity.id, user_update, { new: true });

        return res.status(200).json({
            status: "success",
            message: "User Updated Successfully",
            user: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "User update failed",
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

        // Configurar el correo electrónico
        const mailOptions = {
            from: 'tucorreo@gmail.com', // Remitente
            to: email, // Destinatario
            subject: 'Recuperación de Contraseña', // Asunto
            text: `Tu OTP para recuperar la contraseña es: ${otp}` // Cuerpo del correo
        };

        // Enviar el correo electrónico
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error enviando el correo:', error);
                return res.status(500).json({ message: 'Error sending email' });
            } else {
                console.log('Correo enviado:', info.response);
                return res.status(200).json({ message: 'OTP sent. Check your email.' });
            }
        });

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


// Dashboard endpoint 

const countUsersByRole = async (req, res) => {
    try {
        // Agregación para contar usuarios por rol
        const usersByRole = await user.aggregate([
            {
                $group: {
                    _id: "$role", // Agrupar por el campo "role"
                    count: { $sum: 1 } // Contar cuántos usuarios hay en cada grupo
                }
            },
            {
                $sort: { _id: 1 } // Ordenar los resultados por rol (ascendente)
            }
        ]);

        // Si no hay usuarios
        if (!usersByRole || usersByRole.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No users found'
            });
        }

        // Formatear la respuesta para que sea más clara
        const result = usersByRole.map(roleGroup => ({
            role: roleGroup._id,
            count: roleGroup.count
        }));

        // Responder con el resultado
        return res.status(200).json({
            status: 'success',
            message: 'Users counted by role',
            data: result
        });
    } catch (error) {
        // Manejo de errores
        console.error("Error counting users by role:", error);
        return res.status(500).json({
            status: 'error',
            message: 'Server Error',
            error: error.message
        });
    }
};

const updateFcmToken = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ message: "FCM token is required" });
        }

        await user.findByIdAndUpdate(userId, { fcmToken });

        res.status(200).json({ message: "FCM token updated successfully" });
    } catch (error) {
        console.error("Error updating FCM token:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


const searchAll = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "El parámetro de búsqueda es obligatorio." });
        }

        // Realizar búsquedas en paralelo
        const [users, publications, preferences, suggestions] = await Promise.all([
            user.find({
                $or: [
                    { username: new RegExp(query, "i") },
                    { email: new RegExp(query, "i") }
                ]
            }),
            Publication.find({
                $or: [
                    { title: new RegExp(query, "i") },
                    { content: new RegExp(query, "i") }
                ]
            }),
            Preferences.find({
                preference: new RegExp(query, "i")
            }),
            Suggestions.find({
                suggestion: new RegExp(query, "i")
            })
        ]);

        // Verificar si todas las búsquedas están vacías
        if (users.length === 0 && publications.length === 0 && preferences.length === 0 && suggestions.length === 0) {
            return res.status(200).json({ message: "Consulta realizada con éxito, pero no se encontraron resultados.", data: [] });
        }

        // Enviar respuesta con los datos organizados
        res.status(200).json({
            message: "Búsqueda exitosa",
            data: {
                users,
                publications,
                preferences,
                suggestions
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Error en la búsqueda", error: error.message });
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
    countUsersByRole,
    updateFcmToken,
    searchAll, 
};