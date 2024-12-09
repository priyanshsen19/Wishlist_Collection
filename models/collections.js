const mongoose = require('mongoose');

const collections = new mongoose.Schema({
    user_email: String,
    collection_id: Number,
    sku: String,
    like: Boolean,
    dislike: Boolean
})

module.exports = mongoose.model('collections',collections);