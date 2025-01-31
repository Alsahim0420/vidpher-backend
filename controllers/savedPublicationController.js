const SavedPublication = require("../models/savedPublication");
const Publication = require("../models/publication");

const toggleSavePublication = async (req, res) => {
    const { publicationId } = req.body;
    const userId = req.user.id;

    console.log("userId:", userId); // Depuración: Verifica que userId no sea undefined
    console.log("publicationId:", publicationId); // Depuración: Verifica que publicationId no sea undefined

    try {
        const publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).json({ message: "Publicación no encontrada." });
        }

        const savedPublication = await SavedPublication.findOne({
            user: userId,
            publication: publicationId
        });

        if (savedPublication) {
            await SavedPublication.deleteOne({ _id: savedPublication._id });
            return res.status(200).json({ message: "Publicación eliminada de guardados." });
        } else {
            const newSavedPublication = new SavedPublication({
                user: userId,
                publication: publicationId
            });
            await newSavedPublication.save();
            return res.status(201).json({ message: "Publicación guardada correctamente." });
        }
    } catch (error) {
        console.error("Error en toggleSavePublication:", error); // Depuración: Verifica el error completo
        return res.status(500).json({ message: "Error al guardar/eliminar la publicación." });
    }
};

// Exportamos la función
module.exports = { toggleSavePublication };