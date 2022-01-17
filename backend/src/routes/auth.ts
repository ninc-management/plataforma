import * as express from 'express';

import ProspectModel from '../models/prospect';
import UserModel from '../models/user';
import { Prospect } from '../models/prospect';

const router = express.Router();

router.post('/register', (req, res, next) => {
  const p = new Prospect();
  p.fullName = req.body.fullName;
  p.email = req.body.email;
  p.phone = req.body.phone;
  p.state = req.body.state;
  p.city = req.body.city;
  p.education = req.body.education;
  p.arquitetura = req.body.arquitetura ? req.body.arquitetura : false;
  p.design = req.body.design ? req.body.design : false;
  p.civil = req.body.civil ? req.body.civil : false;
  p.eletrica = req.body.eletrica ? req.body.eletrica : false;
  p.incendio = req.body.incendio ? req.body.incendio : false;
  p.sanitaria = req.body.sanitaria ? req.body.sanitaria : false;
  p.impermeabilizacao = req.body.impermeabilizacao ? req.body.impermeabilizacao : false;
  p.ambiental = req.body.ambiental ? req.body.ambiental : false;
  p.hidrico = req.body.hidrico ? req.body.hidrico : false;
  p.more = req.body.more ? req.body.more : false;
  p.meet = req.body.more ? req.body.meet : '';
  p.emailNortan = req.body.emailNortan ? req.body.emailNortanortan : 'não definido';
  p.article = req.body.article ? req.body.article : 'a';
  p.level = req.body.level ? req.body.level : 'a';
  p.mainDepartment = req.body.mainDepartment ? req.body.mainDepartment : 'a';
  const prospect = new ProspectModel(p);
  UserModel.findOne({ email: req.body.email }).then((user) => {
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
  UserModel.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json({
      isRegistered: !!user,
    });
  });
});

router.post('/isProspect', (req, res, next) => {
  ProspectModel.findOne({ email: req.body.email }).then((prospect) => {
    res.status(200).json({
      isRegistered: !!prospect,
    });
  });
});

export default router;
