const Suggestion = require("../models/suggestion");
const Publication = require("../models/publication");

const getSuggestions = async (req, res) => {
    const userId = req.user.id; // Obtén el ID del usuario autenticado

    try {
        // Busca todas las sugerencias para el usuario
        const suggestions = await Suggestion.find({ user: userId }).populate('publication');

        // Extrae las publicaciones sugeridas
        const suggestedPublications = suggestions.map(suggestion => suggestion.publication);

        return res.status(200).json({ suggestedPublications });
    } catch (error) {
        console.error("Error en getSuggestions:", error);
        return res.status(500).json({ message: "Error fetching suggestions." });
    }
};

module.exports = { getSuggestions };