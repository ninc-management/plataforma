import * as express from 'express';
import nodemailer from 'nodemailer';
import { Sector } from '../models/shared';

import { User } from '../models/user';

const router = express.Router();

function sendMail(user: User, callback: any): void {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'dad@cenaalagoas.com',
      pass: process.env.EMAIL_PASSWD,
    },
  });
  const mailOptions = {
    from: '"Diretoria de Administração" <dad@nortanprojetos.com>',
    to: 'hugocunha@nortanprojetos.com,natanael.filho@nortanprojetos.com',
    subject: 'Novo cadastro na Plataforma! 🎉🎉🎉',
    html:
      '<h3>🎉 Novo consultor cadastrado na lista de espera 🎉</h3><br>' +
      '<ul><li>Nome: ' +
      user.fullName +
      '</li>' +
      '<li>Email: ' +
      user.email +
      '</li>' +
      '<li>Telefone: ' +
      user.phone +
      '</li>' +
      '<li>Cidade: ' +
      user.city +
      '</li>' +
      '<li>Estado: ' +
      user.state +
      '</li>' +
      '<li>Formação: ' +
      user.education +
      '</li>' +
      '<li>Interesses: ' +
      '<ul>' +
      user.sectors
        .map((sector) => '<li> ' + (sector as Sector).abrev + ' - ' + (sector as Sector).name + ' ✔️ </li>')
        .join() +
      '</ul> </li>' +
      '<li>Quer ser contactado?: ' +
      (user.more ? '✔️' : '❌') +
      '</li>' +
      '<li>Detalhes: ' +
      user.meet +
      '</li></ul>',
  };
  transporter.sendMail(mailOptions, callback);
}

router.post('/', (req, res, next) => {
  const user = req.body as User;
  sendMail(user, (err, info) => {
    if (err) {
      console.log('Erro envio de mail:', err);
      res.status(201).json({
        message:
          'Usuário cadastrado com sucesso, mas email de notificação não enviado!\nAguarde a aprovação do seu cadastro 🙂\nEm breve entraremos em contato com você!',
      });
    } else {
      res.status(201).json({
        message:
          'Usuário cadastrado com sucesso!\nAguarde a aprovação do seu cadastro 🙂\nEm breve entraremos em contato com você!',
      });
    }
  });
});

export default router;
