const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const User = require('./user');

const prospectSchema = mongoose.Schema(User.schema);

prospectSchema.plugin(uniqueValidator);

module.exports = mongoose.model('prospect', prospectSchema);
