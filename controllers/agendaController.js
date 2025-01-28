const Agenda = require('../models/Agenda');

// Controlador para crear un dato en la agenda
const save = async (req, res) => {
    try {
        // Obtener el id del usuario desde el token
        const userId = req.user.id;

        // Obtener los datos del cuerpo de la petición
        const { lugar, title, hora, dia } = req.body;

        // Validar que todos los campos obligatorios estén presentes
        if (!lugar || !title || !hora || !dia) {
            return res.status(400).send({
                status: 'error',
                message: 'Todos los campos son obligatorios.'
            });
        }

        // Crear un nuevo registro en la agenda
        const newAgendaEntry = new Agenda({
            user: userId,
            lugar,
            title,
            hora,
            dia
        });

        // Guardar el registro en la base de datos
        await newAgendaEntry.save();

        // Enviar respuesta de éxito
        return res.status(201).send({
            status: 'success',
            message: 'Registro creado con éxito en la agenda.',
            agenda: newAgendaEntry
        });

    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error al crear el registro en la agenda.',
            error: err.message
        });
    }
};

module.exports = {
    save
};