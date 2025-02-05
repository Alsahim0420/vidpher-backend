const Suggestion = require("../models/suggestions"); 
const Publication = require("../models/publication");
const Preferences = require("../models/preferences");

const getSuggestions = async (req, res) => {
    try {
       
        const suggestions = await Suggestion.find();

      
        if (suggestions.length === 0) {
            return res.status(200).json({ message: "No suggestions found." });
        }


        const publicationIds = suggestions.map(suggestion => suggestion.publication);


        const suggestedPublications = await Publication.find({ _id: { $in: publicationIds } });

   
        return res.status(200).json({ suggestedPublications });
    } catch (error) {
        console.error("Error en getSuggestions:", error);
        return res.status(500).json({ message: "Error fetching suggestions." });
    }
};



const getSuggestionsByPreferences = async (req, res) => {
    const userId = req.user.id; // Obtén el ID del usuario autenticado

    try {
        // 1. Busca las preferencias del usuario
        const userPreferences = await Preferences.findOne({ user: userId });

        // Si el usuario no tiene preferencias, devuelve un mensaje
        if (!userPreferences || userPreferences.preferences.length === 0) {
            return res.status(200).json({ message: "No preferences found for this user." });
        }

        // 2. Filtra las publicaciones que coincidan con las preferencias del usuario
        const suggestedPublications = await Publication.find({
            // Aquí asumimos que las preferencias están relacionadas con algún campo de la publicación, como "tags" o "category".
            // Por ejemplo, si las preferencias son categorías, podrías buscar en un campo "category" de la publicación.
            // Ajusta esto según la estructura de tus publicaciones.
            $or: userPreferences.preferences.map(preference => ({
                // Ejemplo: Si las preferencias son categorías, busca en el campo "category"
                category: preference
            }))
        });

        // Si no hay publicaciones que coincidan, devuelve un mensaje
        if (suggestedPublications.length === 0) {
            return res.status(200).json({ message: "No suggestions found based on your preferences." });
        }

        // 3. Devuelve las publicaciones filtradas
        return res.status(200).json({ suggestedPublications });
    } catch (error) {
        console.error("Error en getSuggestionsByPreferences:", error);
        return res.status(500).json({ message: "Error fetching suggestions based on preferences." });
    }
};


module.exports = { 
    getSuggestions,
    getSuggestionsByPreferences 
};