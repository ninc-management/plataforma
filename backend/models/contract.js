const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userPayment = {
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: String, required: true },
  value: { type: String, required: true },
};

const payment = {
  service: { type: String, required: true },
  value: { type: String, required: true },
  notaFiscal: { type: String, required: true },
  nortanPercentage: { type: String, required: true },
  team: [userPayment],
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  paid: { type: String, required: true },
  paidDate: { type: Date },
};

const teamMember = {
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: String, required: true },
  distribution: { type: String, required: true },
};

const contractSchema = mongoose.Schema({
  invoice: { type: mongoose.ObjectId, ref: 'Invoice', required: true },
  payments: [payment],
  receipts: [payment],
  status: { type: String, required: true },
  version: { type: String, required: true },
  total: { type: String },
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  team: [teamMember],
});

contractSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Contract', contractSchema);
