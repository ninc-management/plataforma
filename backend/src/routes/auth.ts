import * as express from 'express';

import ProspectModel from '../models/prospect';
import UserModel from '../models/user';
import { Prospect } from '../models/prospect';
import { prospectMap } from '../shared/global';
import { cloneDeep } from 'lodash';

const router = express.Router();

router.post('/register', (req, res, next) => {
  const p = req.body as Prospect;
  const prospect = new ProspectModel(p);
  UserModel.findOne({ email: req.body.email }).then((user) => {
    if (!user) {
      prospect
        .save()
        .then((prospect) => {
          prospectMap[prospect._id] = cloneDeep(prospect.toJSON());
          res.redirect(307, '/api/sendmail');
        })
        .catch((err) => {
          console.log('Erro de cadastro:', err);
          res.status(500).json({
            error: 'Email já cadastrado na plataforma',
          });
        });
    } else
      res.status(500).json({
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

router.post('/isActive', (req, res, next) => {
  UserModel.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json({
      isActive: user ? user.active : false,
    });
  });
});

export default router;
