const Suggestion = require("../models/suggestions"); 
const Publication = require("../models/publication");

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

module.exports = { getSuggestions };