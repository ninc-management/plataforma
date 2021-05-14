const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userPayment = {
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: String, required: true },
  value: { type: String, required: true },
};

const uploadedFile = {
  name: { type: String, required: true },
  url: { type: String, required: true },
};

const expenseTeamMember = {
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  value: { type: String, required: true },
  percentage: { type: String, required: true },
};

const expense = {
  author: { type: mongoose.ObjectId, ref: 'User', required: true },
  source: { type: mongoose.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  coordination: { type: String },
  nf: { type: Boolean, required: true },
  type: { type: String, required: true },
  splitType: { type: String, required: true },
  value: { type: String, required: true },
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  paid: { type: Boolean, required: true },
  paidDate: { type: Date },
  uploadedFiles: [uploadedFile],
  team: [expenseTeamMember],
};

const payment = {
  service: { type: String, required: true },
  value: { type: String, required: true },
  team: [userPayment],
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  paid: { type: Boolean, required: true },
  paidDate: { type: Date },
};

const receipt = {
  description: { type: String, required: true },
  value: { type: String, required: true },
  notaFiscal: { type: String, required: true },
  nortanPercentage: { type: String, required: true },
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  paid: { type: Boolean, required: true },
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
  receipts: [receipt],
  expenses: [expense],
  status: { type: String, required: true },
  version: { type: String, required: true },
  ISS: { type: String, required: true },
  total: { type: String },
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  team: [teamMember],
});

contractSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Contract', contractSchema);
