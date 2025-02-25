const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');


const PaymentSchema = Schema({
    _id: { type: String, required: true }, 
    userId:
    {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentIntentId:
    {
        type: String,
        required: true
    },
    amount:
    {
        type: Number,
        required: true
    },
    currency:
    {
        type: String,
        required: true
    },
    status:
    {
        type: String,
        required: true
    },
    createdAt:
    {
        type: Date,
        default: Date.now
    },
    plan:
    {
        type: Number,
        required: true
    },
    paymentUrl: { 
        type: String, 
        required: true 
    },
}, { _id: false });

PaymentSchema.plugin(mongoosePaginate);

module.exports = model('Payment', PaymentSchema, 'payments');