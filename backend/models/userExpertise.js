const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userExpertiseSchema = mongoose.Schema({
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: String, required: true },
  text: { type: String, required: true },
});
userExpertiseSchema.plugin(uniqueValidator);

module.exports = mongoose.model('UserExpertise', userExpertiseSchema);
