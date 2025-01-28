const Preferences = require('../models/preferences');

// Controlador para agregar preferencias a un usuario
const savePreferences = async (req, res) => {
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
            preferences: newPreferencesEntry
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

module.exports = {
    savePreferences
};
