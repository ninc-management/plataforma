const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const invoiceProduct = {
  name: { type: String, required: true },
  amount: { type: String, required: true },
  value: { type: String, required: true },
  total: { type: String, required: true },
  subproducts: [{ type: String, required: true }],
};

const invoiceMaterial = {
  name: { type: String, required: true },
  amount: { type: String, required: true },
  value: { type: String, required: true },
  total: { type: String, required: true },
};

const invoiceStage = {
  name: { type: String, required: true },
  value: { type: String, required: true },
};

const teamMember = {
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: String, required: true },
};

const invoiceSchema = mongoose.Schema({
  author: { type: mongoose.ObjectId, ref: 'User', required: true },
  department: { type: String, required: true },
  coordination: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  service: { type: String, required: true },
  contractor: { type: mongoose.ObjectId, ref: 'Contractor', required: true },
  name: { type: String, required: true },
  value: { type: String, required: true },
  status: { type: String, required: true },
  team: [teamMember],
  trello: { type: Boolean },
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  subtitle1: { type: String },
  subtitle2: { type: String },
  contactName: { type: String },
  contactPlural: { type: Boolean },
  contractorFullName: { type: String },
  subject: { type: String },
  peep: { type: String },
  laep: [{ type: String }],
  dep: { type: String },
  peee: { type: String },
  laee: [{ type: String }],
  dee: { type: String },
  peec: { type: String },
  laec: [{ type: String }],
  dec: { type: String },
  discount: { type: String },
  materialListType: { type: String },
  productListType: { type: String },
  products: [invoiceProduct],
  stages: [invoiceStage],
  materials: [invoiceMaterial],
  importants: [{ type: String }],
});

invoiceSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Invoice', invoiceSchema);
