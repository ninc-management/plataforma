const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userPaymentSchema = mongoose.Schema({
  payment: { type: mongoose.ObjectId, ref: 'Payment', required: true },
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: String, required: true },
  value: { type: String, required: true },
});
userPaymentSchema.plugin(uniqueValidator);

module.exports = mongoose.model('UserPayment', userPaymentSchema);
