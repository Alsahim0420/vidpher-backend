const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const StorySchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User",
    },
    text: String,
    file: String,
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000, // 24 horas desde la creación
        index: { expires: '1s' }, // Configuración TTL para eliminación automática
    },
    likes: {
        type: Number,
        default: 0,
    },
    comments: Array,
    suggested: {
        type: Boolean,
        default: false,
    },
    views: { 
        type: Number, 
        default: 0 
    },
    savesCount: { 
        type: Number, 
        default: 0 
    }
});


// Agrega el plugin de paginación
StorySchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Story", StorySchema);