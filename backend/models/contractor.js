const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const contractorSchema = mongoose.Schema({
  fullName: { type: String, required: true },
  document: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  address: { type: String, required: true },
});

contractorSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Contractor', contractorSchema);
