const {Schema, model} = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const UserSchema = new Schema({
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
        type: String,
        required: true
    },
    image:{
        type:String,
        default:"default.png"
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    otp:String,
    bio:String
});

UserSchema.plugin(mongoosePaginate);

module.exports = model('User', UserSchema, "Users");