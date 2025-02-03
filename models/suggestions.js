const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const SuggestionSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User",
        required: true // Obligatorio
    },
    publication: {
        type: Schema.ObjectId,
        ref: "Publication",
        required: true // Obligatorio
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Agrega el plugin de paginación
SuggestionSchema.plugin(mongoosePaginate);

module.exports = model("Suggestion", SuggestionSchema);

