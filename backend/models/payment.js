const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const paymentSchema = mongoose.Schema({
  contract: { type: mongoose.ObjectId, ref: 'Contract', required: true },
  service: { type: String, required: true },
  value: { type: String, required: true },
  notaFiscal: { type: String, required: true },
  nortanPercentage: { type: String, required: true },
  team: [{ type: mongoose.ObjectId, ref: 'UserPayment' }],
});

paymentSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Payment', paymentSchema);
