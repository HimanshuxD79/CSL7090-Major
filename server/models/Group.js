const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
    name: String,
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    members: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        encryptedGroupKey: String, // Encrypted group key for each member
        username: String // Username of each member
    }]
});

module.exports = mongoose.model('Group', GroupSchema);
