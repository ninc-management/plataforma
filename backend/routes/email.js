const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

const sendMail = (user, callback) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'contato@cenaalagoas.com',
      pass: process.env.EMAIL_PASSWD,
    },
  });
  const mailOptions = {
      from: '"Contato Nortan Projetos" <contato@nortanprojetos.com>',
      to: 'financeiro@nortanprojetos.com',
      subject: 'Novo cadastro na Plataforma! 🎉🎉🎉',
      html: '<h3>🎉 Novo consultor cadastrado 🎉</h3><br>'+
      '<ul><li>Nome: ' + user.fullName +'</li>'+
      '<li>Email: ' + user.email +'</li>'+
      '<li>Telefone: ' + user.phone +'</li>'+
      '<li>Cidade: ' + user.city +'</li>'+
      '<li>Estado: ' + user.state +'</li>'+
      '<li>Formação: ' + user.education +'</li>'+
      '<li>Interesses:'+
      '<ul><li>Arquitetura: ' + (user.arquitetura ? '✔️' : '❌') +'</li>'+
      '<li>Design de Interiores: ' + (user.design ? '✔️' : '❌') +'</li>'+
      '<li>Engenharia Civil: ' + (user.civil ? '✔️' : '❌') +'</li>'+
      '<li>Engenharia Elétrica: ' + (user.eletrica ? '✔️' : '❌') +'</li>'+
      '<li>Engenharia Sanitária: ' + (user.sanitaria ? '✔️' : '❌') +'</li>'+
      '<li>Impermeabilização: ' + (user.impermeabilizacao ? '✔️' : '❌') +'</li>'+
      '<li>Engenharia ambiental: ' + (user.ambiental ? '✔️' : '❌') +'</li>'+
      '<li>Recursos Hidricos: ' + (user.hidrico ? '✔️' : '❌') +'</li></ul></li>'+
      '<li>Quer ser contactado?: ' + (user.more ? '✔️' : '❌') +'</li>'+
      '<li>Detalhes: ' + user.meet +'</li></ul>',
    };
    transporter.sendMail(mailOptions, callback);
}

router.post('/', (req, res, next) => {
  let user = req.body;
  sendMail(user, (err, info) => {
    if (err) {
      console.log(err);
      res.status(400);
      res.send({ error: 'Failed to send email' });
    } else {
      res.status(201).json(req.query);
    }
  });
});

module.exports = router;
