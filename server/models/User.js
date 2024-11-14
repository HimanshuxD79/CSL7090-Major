const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    username: String,
    password: String,
    publicKey: String,
});

module.exports = mongoose.model('User', UserSchema);
