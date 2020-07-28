const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const paymentSchema = mongoose.Schema({
  contract: { type: mongoose.ObjectId, ref: 'Contract', required: true },
  client: { type: mongoose.ObjectId, ref: 'Client', required: true },
  interestNumber: { type: Number, required: true },
  interestTotal: { type: Number, required: true },
  service: { type: String, required: true },
  value: { type: String, required: true },
  team: [{ type: mongoose.ObjectId, ref: 'UserPayment', required: true }],
});

paymentSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Payment', paymentSchema);
