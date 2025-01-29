const {Schema,model} = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');


const PaymentSchema = Schema({
    userId: 
    { 
        type: mongoose.Schema.Types.ObjectId, 
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
    }
});

PaymentSchema.plugin(mongoosePaginate);

module.exports = model('Payment', PaymentSchema, 'payments');