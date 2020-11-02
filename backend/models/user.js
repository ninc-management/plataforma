const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
  fullName: { type: String, required: true },
  exibitionName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  education: { type: String, required: true },
  arquitetura: { type: Boolean },
  instalacoes: { type: Boolean },
  design: { type: Boolean },
  civil: { type: Boolean },
  eletrica: { type: Boolean },
  sanitaria: { type: Boolean },
  obras: { type: Boolean },
  impermeabilizacao: { type: Boolean },
  ambiental: { type: Boolean },
  hidrico: { type: Boolean },
  adm: { type: Boolean },
  password: { type: String, required: true },
  more: { type: Boolean },
  meet: { type: String },
  profilePicture: { type: String },
  mainDepartment: { type: String, required: true },
  document: { type: String, unique: true },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
