const Preferences = require('../models/preferences');

// Controlador para agregar preferencias a un usuario
const save = async (req, res) => {
    try {
        // Obtener el id del usuario desde el token
        const userId = req.user.id;

        // Obtener las preferencias del cuerpo de la petición
        const { preferences } = req.body;

        // Validar que el array de preferencias esté presente y no esté vacío
        if (!preferences || preferences.length === 0) {
            return res.status(400).send({
                status: 'error',
                message: 'El array de preferencias no puede estar vacío.'
            });
        }

        // Crear un nuevo registro de preferencias para el usuario
        const newPreferencesEntry = new Preferences({
            user: userId,
            preferences
        });

        // Guardar el registro de preferencias en la base de datos
        await newPreferencesEntry.save();

        // Enviar respuesta de éxito
        return res.status(201).send({
            status: 'success',
            message: 'Preferencias guardadas con éxito.',
        });

    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error al guardar las preferencias.',
            error: err.message
        });
    }
};


const preferencesById = async (req, res) => {
    try {
        // Obtener el id del usuario desde el token (req.user.id)
        const userId = req.user.id;

        // Buscar las preferencias del usuario en la base de datos
        const preferences = await Preferences.findOne({ user: userId }).select('-user'); // Usamos populate para traer datos adicionales del usuario

        // Validar si no se encuentran preferencias para el usuario
        if (!preferences) {
            return res.status(404).send({
                status: 'error',
                message: 'No preferences were found for the user provided.'
            });
        }

        // Enviar las preferencias como respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Successfully obtained preferences.',
            data: preferences,
        });
    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error getting preferences.',
            error: err.message
        });
    }
};


const allPreferences = async (req, res) => {
    try {
        // Buscar todas las preferencias en la base de datos
        const preferences = await Preferences.find().populate('user', 'name email'); // Usamos populate para incluir datos del usuario

        // Validar si no se encuentran preferencias en la base de datos
        if (!preferences || preferences.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'No preferences were found in the system.'
            });
        }

        // Enviar las preferencias como respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Successfully obtained preferences.',
            preferences
        });
    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error getting preferences.',
            error: err.message
        });
    }
};



module.exports = {
    save,
    preferencesById,
    allPreferences
};
