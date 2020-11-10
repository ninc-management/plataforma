const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const teamMemberSchema = mongoose.Schema({
  user: { type: mongoose.ObjectId, ref: 'User', required: true },
  coordination: { type: String, required: true },
  invoice: { type: mongoose.ObjectId, ref: 'Invoice', required: true },
});
teamMemberSchema.plugin(uniqueValidator);

module.exports = mongoose.model('TeamMember', teamMemberSchema);
