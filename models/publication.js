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
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Referencia al usuario que comentó
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
    suggested: {
        type: Boolean,
        default: false
    },
    title: String,
    subtitle: String,
});


PublicationSchema.virtual('isLiked').get(function () {
    // this se refiere al documento actual (publicación)
    return this.likedBy.includes(this._locals.userId); // Verifica si el usuario actual dio like
});

// Configurar para que las propiedades virtuales se incluyan en toJSON y toObject
PublicationSchema.set('toJSON', { virtuals: true });
PublicationSchema.set('toObject', { virtuals: true });

// Agrega el plugin de paginación
PublicationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Publication", PublicationSchema);
