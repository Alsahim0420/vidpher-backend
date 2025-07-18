const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    otp: String,
    bio: String,
    fcmToken: {
        type: String
    },
    gender: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    cellphone: {
        type: String,
        default: ""
    },
    payment_status: {
        type: Boolean,
        default: false
    },
    plan_type: {
        type: Number,
        default: 0
    },
    publicationsCount: {
        type: Number,
        default: 0
    },
    storiesCount: {
        type: Number,
        default: 0
    },
    profileViews: {
        type: Number,
        default: 0
    },
    services: {
        type: [String],
        default: []
    }
});

// Agregar índice único para username
UserSchema.index({ username: 1 }, { unique: true });

UserSchema.plugin(mongoosePaginate);

module.exports = model('User', UserSchema, "Users");
