const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const AgendaSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    duration: {
        type: Date,
        required: true
    },
    date: {
        type: Date,
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

AgendaSchema.plugin(mongoosePaginate);

module.exports = model('Agenda', AgendaSchema);