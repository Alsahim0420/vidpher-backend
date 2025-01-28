const { Schema, model } = require('mongoose');

const PreferencesSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',  // Referencia al modelo de User
        required: true
    },
    preferences: [{
        type: String,  // O puedes usar otro tipo dependiendo de la estructura de tus preferencias
        required: true
    }],
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = model('Preferences', PreferencesSchema);
