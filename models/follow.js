const {Schema,model} = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const FollowSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followed: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

FollowSchema.plugin(mongoosePaginate);

module.exports = model('Follow', FollowSchema, 'follows');