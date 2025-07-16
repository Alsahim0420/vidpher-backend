const AccountDeletionRequest = require('../models/accountDeletionRequest');

// Controlador para solicitar eliminación de cuenta
const requestAccountDeletion = async (req, res) => {
    try {
        // Obtener el id del usuario y la descripción del cuerpo de la petición
        const { userId, description } = req.body;

        // Validar que el userId sea obligatorio
        if (!userId) {
            return res.status(400).send({
                status: 'error',
                message: 'The userId field is required.'
            });
        }

        // Verificar si ya existe una solicitud de eliminación para este usuario
        const existingRequest = await AccountDeletionRequest.findOne({ user: userId });

        if (existingRequest) {
            return res.status(400).send({
                status: 'error',
                message: 'A deletion request already exists for this user.'
            });
        }

        // Crear una nueva solicitud de eliminación de cuenta
        const newDeletionRequest = new AccountDeletionRequest({
            user: userId,
            description: description || null
        });

        // Guardar la solicitud en la base de datos
        await newDeletionRequest.save();

        // Enviar respuesta de éxito
        return res.status(200).send({
            status: 'success',
            message: 'Account deletion request created successfully.',
            data: {
                id: newDeletionRequest._id,
                userId: newDeletionRequest.user,
                description: newDeletionRequest.description,
                createdAt: newDeletionRequest.createdAt
            }
        });

    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error creating account deletion request.',
            error: err.message
        });
    }
};

// Controlador para obtener todas las solicitudes de eliminación (para administradores)
const getAllDeletionRequests = async (req, res) => {
    try {
        // Buscar todas las solicitudes de eliminación en la base de datos
        const deletionRequests = await AccountDeletionRequest.find()
            .populate('user', 'name email username')
            .sort({ createdAt: -1 }); // Ordenar por fecha de creación (más recientes primero)

        // Validar si no se encuentran solicitudes en la base de datos
        if (!deletionRequests || deletionRequests.length === 0) {
            return res.status(404).send({
                status: 'error',
                message: 'No account deletion requests found in the system.'
            });
        }

        // Enviar las solicitudes como respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Account deletion requests retrieved successfully.',
            data: deletionRequests
        });
    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error retrieving account deletion requests.',
            error: err.message
        });
    }
};

// Controlador para obtener una solicitud específica por ID
const getDeletionRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar la solicitud de eliminación por ID
        const deletionRequest = await AccountDeletionRequest.findById(id)
            .populate('user', 'name email username');

        // Validar si no se encuentra la solicitud
        if (!deletionRequest) {
            return res.status(404).send({
                status: 'error',
                message: 'Account deletion request not found.'
            });
        }

        // Enviar la solicitud como respuesta
        return res.status(200).send({
            status: 'success',
            message: 'Account deletion request retrieved successfully.',
            data: deletionRequest
        });
    } catch (err) {
        // Manejo de errores
        return res.status(500).send({
            status: 'error',
            message: 'Error retrieving account deletion request.',
            error: err.message
        });
    }
};

module.exports = {
    requestAccountDeletion,
    getAllDeletionRequests,
    getDeletionRequestById
}; 