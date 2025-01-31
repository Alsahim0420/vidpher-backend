const SavedPublication = require("../models/savedPublication");

const toggleSavePublication = async (req, res) => {
    const { publicationId } = req.body;
    const userId = req.user._id; // Obtenemos el ID del usuario desde el token

    try {
        // Verificar si la publicación existe
        const publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).json({ message: "Publicación no encontrada." });
        }

        // Verificar si la publicación ya está guardada por el usuario
        const savedPublication = await SavedPublication.findOne({
            user: userId,
            publication: publicationId
        });

        if (savedPublication) {
            // Si ya está guardada, la eliminamos
            await SavedPublication.deleteOne({ _id: savedPublication._id });
            return res.status(200).json({ message: "Publicación eliminada de guardados." });
        } else {
            // Si no está guardada, la guardamos
            const newSavedPublication = new SavedPublication({
                user: userId,
                publication: publicationId
            });
            await newSavedPublication.save();
            return res.status(201).json({ message: "Publicación guardada correctamente." });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Error al guardar/eliminar la publicación." });
    }
};

// Exportamos la función
module.exports = { toggleSavePublication };