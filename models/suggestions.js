const { Schema, model } = require("mongoose");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const SuggestionSchema = Schema({
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
    watchPublication:{
        type:Boolean,
        default:true
    },
    likes:{
        type:Number,
        default:0
        },  
    comments:Array

})


// Agrega el plugin de paginación
SuggestionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Suggestion", SuggestionSchema);