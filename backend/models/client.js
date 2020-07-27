const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const clientSchema = mongoose.Schema({
  fullName: { type: String, required: true },
  document: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
});

clientSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Client', clientSchema);
