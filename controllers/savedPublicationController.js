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
            return res.status(404).json({ message: "Publication not found." });
        }

        const savedPublication = await SavedPublication.findOne({
            user: userId,
            publication: publicationId
        });

        if (savedPublication) {
            await SavedPublication.deleteOne({ _id: savedPublication._id });
            return res.status(200).json({ message: "Publication removed from saves." });
        } else {
            const newSavedPublication = new SavedPublication({
                user: userId,
                publication: publicationId
            });
            await newSavedPublication.save();
            return res.status(201).json({ message: "Publication saved successfully." });
        }
    } catch (error) {
        console.error("Error en toggleSavePublication:", error); // Depuración: Verifica el error completo
        return res.status(500).json({ message: "Error saving/deleting post." });
    }
};

const getSavedPublications = async (req, res) => {
    const userId = req.user.id; // Obtén el ID del usuario logueado

    try {
        // 1. Busca las publicaciones guardadas por el usuario
        const savedPublications = await SavedPublication.find({ user: userId });

        // Si no hay publicaciones guardadas, devuelve un mensaje
        if (savedPublications.length === 0) {
            return res.status(200).json({ message: "No saved publications found." });
        }

        // 2. Extrae los IDs de las publicaciones guardadas
        const publicationIds = savedPublications.map(sp => sp.publication);

        // 3. Busca los detalles de las publicaciones guardadas
        const publications = await Publication.find({ _id: { $in: publicationIds } });

        // 4. Devuelve las publicaciones encontradas
        return res.status(200).json({ publications });
    } catch (error) {
        console.error("Error en getSavedPublications:", error);
        return res.status(500).json({ message: "Error fetching saved publications." });
    }
};

const getSavedPublicationsByUserId = async (req, res) => {
    const { userId } = req.params; // Obtén el ID del usuario desde los parámetros de la URL

    try {
        // 1. Busca las publicaciones guardadas por el usuario
        const savedPublications = await SavedPublication.find({ user: userId });

        // Si no hay publicaciones guardadas, devuelve un mensaje
        if (savedPublications.length === 0) {
            return res.status(200).json({ message: "No saved publications found for this user." });
        }

        // 2. Extrae los IDs de las publicaciones guardadas
        const publicationIds = savedPublications.map(sp => sp.publication);

        // 3. Busca los detalles de las publicaciones guardadas
        const publications = await Publication.find({ _id: { $in: publicationIds } });

        // 4. Devuelve las publicaciones encontradas
        return res.status(200).json({ publications });
    } catch (error) {
        console.error("Error en getSavedPublicationsByUserId:", error);
        return res.status(500).json({ message: "Error fetching saved publications." });
    }
};

// Exportamos la función
module.exports = { 
    toggleSavePublication,
    getSavedPublications,
    getSavedPublicationsByUserId
 };