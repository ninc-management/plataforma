const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userPaymentSchema = mongoose.Schema({
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: mongoose.ObjectId, ref: 'Client', required: true },
  value: { type: String, required: true },
});
userPaymentSchema.plugin(uniqueValidator);

module.exports = mongoose.model('UserPayment', userPaymentSchema);
