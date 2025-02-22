const Agenda = require('../models/agenda');
const convertTo24HourFormat = require('../utils/timeUtils');

const save = async (req, res) => {
    try {
        // Obtener el id del usuario desde el token
        const userId = req.user.id;

        // Obtener los datos del cuerpo de la petición
        let { location, title, duration, time, date } = req.body;

        // Validar que todos los campos obligatorios estén presentes
        if (!location || !title || !duration || !time || !date) {
            return res.status(400).send({
                status: 'error',
                message: 'All fields are required.'
            });
        }

        // Convertir la duración a número
        const durationInHours = Number(duration);
        if (isNaN(durationInHours)) {
            return res.status(400).send({
                status: 'error',
                message: 'The duration must be a valid number of hours.'
            });
        }

        // ** Formatear `time` a formato 24 horas (sin AM/PM) **
        const formattedTime = convertTo24HourFormat(time);

        // Convertir `time` a minutos para hacer la validación
        const [hours, minutes] = formattedTime.split(':').map(Number);
        const newStartTime = hours * 60 + minutes;
        const newEndTime = newStartTime + durationInHours * 60;

        // Crear un nuevo registro en la agenda
        const newAgendaEntry = new Agenda({
            user: userId,
            location,
            title,
            duration: durationInHours, 
            time: formattedTime, // Guardar el tiempo en formato 24h
            date
        });

        // Guardar el registro en la base de datos
        await newAgendaEntry.save();

        // Enviar respuesta de éxito
        return res.status(201).send({
            status: 'success',
            message: 'Successfully created record in the agenda.',
        });

    } catch (err) {
        return res.status(400).send({
            status: 'error',
            message: 'Error createing event.',
            error: err.message
        });
    }
};





// Controlador para obtener todas las reuniones agendadas por fecha
const byDate = async (req, res) => {
    try {
        // Obtener el id del usuario desde el token
        const userId = req.user.id;

        // Obtener la fecha desde los parámetros de la solicitud
        const { date } = req.params;

        // Validar que se haya proporcionado una fecha
        if (!date) {
            return res.status(400).send({
                status: 'error',
                message: 'A date parameter is required.'
            });
        }

        // Buscar todas las reuniones agendadas en la fecha especificada, incluyendo la info del usuario
        const meetings = await Agenda.find({ user: userId, date });

        // Validar si no hay reuniones en la fecha indicada
        if (meetings.length === 0) {
            return res.status(200).send({
                status: "success",
                message: "Meetings retrieved successfully.",
                agenda: []
            });
        }

        // Respuesta con todas las reuniones de la fecha dada
        return res.status(200).send({
            status: 'success',
            message: 'Meetings retrieved successfully.',
            agenda: meetings
        });

    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error while retrieving meetings.',
            error: err.message
        });
    }
};



module.exports = {
    save,
    byDate
};