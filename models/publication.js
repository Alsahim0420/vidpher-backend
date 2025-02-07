const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");


const PublicationSchema = Schema({
    user: {
        type: Schema.ObjectId,
        ref: "User"
    },
    text: {
        type: String,
        required: true
    },
    file: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    watchPublication: {
        type: Boolean,
        default: true
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{  // Lista de usuarios que han dado like
        type: Schema.ObjectId,
        ref: "User"
    }],
    comments: Array,
    suggested: {
        type: Boolean,
        default: false
    },
    isLiked: {
        type: Boolean,
        default: false
    }
});

// Agrega el plugin de paginación
PublicationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Publication", PublicationSchema);
