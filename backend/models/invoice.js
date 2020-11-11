const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

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
  team: [{ type: mongoose.ObjectId, ref: 'TeamMember' }],
  trello: { type: Boolean },
  created: { type: Date, required: true },
  lastUpdate: { type: Date, required: true },
  subtitle1: { string: String },
  subtitle2: { string: String },
  contactName: { string: String },
  subject: { string: String },
  peep: { string: String },
});

invoiceSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Invoice', invoiceSchema);
