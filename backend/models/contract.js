const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const contractSchema = mongoose.Schema({
  invoice: { type: mongoose.ObjectId, ref: 'Invoice', required: true },
  payments: [{ type: mongoose.ObjectId, ref: 'Payment' }],
});

contractSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Contract', contractSchema);
