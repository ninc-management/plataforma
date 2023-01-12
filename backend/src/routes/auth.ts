import * as express from 'express';
import { cloneDeep } from 'lodash';

import ProspectModel, { Prospect } from '../models/prospect';
import UserModel from '../models/user';
import { prospectMap } from '../shared/global';

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
          if (process.env.GITPOD_WORKSPACE_URL)
            res.status(201).json({
              message: 'Prospecto cadastrado!',
            });
          else res.redirect(307, '/api/sendmail');
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
    res.status(200).json(!!user);
  });
});

router.post('/isProspect', (req, res, next) => {
  ProspectModel.findOne({ email: req.body.email }).then((prospect) => {
    res.status(200).json(!!prospect);
  });
});

router.post('/isActive', (req, res, next) => {
  UserModel.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json(user ? user.active : false);
  });
});

export default router;
