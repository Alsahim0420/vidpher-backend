const { Schema, model } = require("mongoose");

const InteractionStatsSchema = new Schema({
    date: { type: Date, default: Date.now }, // Fecha del registro
    totalFollowers: { type: Number, default: 0 },
    totalPublications: { type: Number, default: 0 },
    totalStories: { type: Number, default: 0 },
    totalProfileViews: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalSavedPublications: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 } // Total general de interacciones
});

module.exports = model("InteractionStats", InteractionStatsSchema);
