const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userExpertise = {
  coordination: { type: String, required: true },
  text: { type: String, required: true },
  shortExpertise: { type: String, required: true },
};

const userSchema = mongoose.Schema({
  fullName: { type: String, required: true },
  exibitionName: { type: String },
  email: { type: String, required: true, unique: true },
  emailNortan: { type: String, required: true },
  phone: { type: String, required: true },
  article: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  education: { type: String },
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
  more: { type: Boolean },
  meet: { type: String },
  profilePicture: { type: String },
  mainDepartment: { type: String, required: true },
  position: [{ type: String }],
  level: { type: String, required: true },
  document: { type: String, unique: true },
  expertise: [userExpertise],
  theme: { type: String },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
