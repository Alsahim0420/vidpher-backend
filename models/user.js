const {Schema, model} = require('mongoose');
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
    image:{
        type:String,
        default:""
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    otp:String,
    bio:String,
    fcmToken: { type: String },
});

UserSchema.plugin(mongoosePaginate);

module.exports = model('User', UserSchema, "Users");