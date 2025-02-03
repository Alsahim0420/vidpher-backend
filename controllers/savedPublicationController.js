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

// Exportamos la función
module.exports = { toggleSavePublication };