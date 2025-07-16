const { Schema, model } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const AccountDeletionRequestSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

AccountDeletionRequestSchema.plugin(mongoosePaginate);

module.exports = model('AccountDeletionRequest', AccountDeletionRequestSchema, 'accountDeletionRequests'); 