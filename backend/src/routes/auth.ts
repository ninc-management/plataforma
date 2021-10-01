import * as express from 'express';

import Prospect from '../models/prospect';
import User from '../models/user';

const router = express.Router();

router.post('/register', (req, res, next) => {
  const prospect = new Prospect({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    state: req.body.state,
    city: req.body.city,
    education: req.body.education,
    arquitetura: req.body.arquitetura ? req.body.arquitetura : false,
    design: req.body.design ? req.body.design : false,
    civil: req.body.civil ? req.body.civil : false,
    eletrica: req.body.eletrica ? req.body.eletrica : false,
    incendio: req.body.incendio ? req.body.incendio : false,
    sanitaria: req.body.sanitaria ? req.body.sanitaria : false,
    impermeabilizacao: req.body.impermeabilizacao ? req.body.impermeabilizacao : false,
    ambiental: req.body.ambiental ? req.body.ambiental : false,
    hidrico: req.body.hidrico ? req.body.hidrico : false,
    more: req.body.more ? req.body.more : false,
    meet: req.body.more ? req.body.meet : '',
    emailNortan: req.body.emailNortan ? req.body.emailNortanortan : 'não definido',
    article: req.body.article ? req.body.article : 'a',
    level: req.body.level ? req.body.level : 'a',
    mainDepartment: req.body.mainDepartment ? req.body.mainDepartment : 'a',
  });
  User.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      prospect
        .save()
        .then(() => {
          res.redirect(307, '/api/sendmail');
        })
        .catch((err) => {
          console.log('Erro de cadastro:', err);
          res.status(201).json({
            error: 'Email já cadastrado na plataforma',
          });
        });
    } else
      res.status(201).json({
        error: 'Email já cadastrado na plataforma',
      });
  });
});

router.post('/isRegistered', (req, res, next) => {
  User.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json({
      isRegistered: !!user,
    });
  });
});

router.post('/isProspect', (req, res, next) => {
  Prospect.findOne({ email: req.body.email }).then((prospect) => {
    res.status(200).json({
      isRegistered: !!prospect,
    });
  });
});

export default router;
