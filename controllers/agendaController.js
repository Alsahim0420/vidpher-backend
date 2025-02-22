const Agenda = require('../models/agenda');
const convertTo24HourFormat = require('../utils/timeUtils');

const moment = require('moment');

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

        // ** Formatear `time` a formato 12 horas con AM/PM **
        const formattedTime = convertTo12HourFormat(time);

        // Crear un nuevo registro en la agenda
        const newAgendaEntry = new Agenda({
            user: userId,
            location,
            title,
            duration: durationInHours, 
            time: formattedTime, // Guardar el tiempo en formato 12h con AM/PM
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
            message: 'Error creating event.',
            error: err.message
        });
    }
};

// Función para convertir el tiempo de 24h a 12h con AM/PM
const convertTo12HourFormat = (time) => {
    const [hour, minute] = time.split(':').map(Number);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12; // Convierte 0 a 12 para formato 12h
    return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
};






// Controlador para obtener todas las reuniones agendadas por fecha
const byDate = async (req, res) => {
    try {
        const userId = req.user.id;
        const { date } = req.params;

        if (!date) {
            return res.status(400).send({
                status: 'error',
                message: 'A date parameter is required.'
            });
        }

        const meetings = await Agenda.find({ user: userId, date });

        if (meetings.length === 0) {
            return res.status(200).send({
                status: "success",
                message: "Meetings retrieved successfully.",
                agenda: []
            });
        }

        // Formatear las fechas antes de enviarlas
        const formattedMeetings = meetings.map(meeting => ({
            ...meeting.toObject(),
            formattedTime: moment(meeting.date).format('hh:mm A') // Ejemplo: 03:30 PM
        }));

        return res.status(200).send({
            status: 'success',
            message: 'Meetings retrieved successfully.',
            agenda: formattedMeetings
        });

    } catch (err) {
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