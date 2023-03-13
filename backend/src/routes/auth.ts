import * as express from 'express';

import ProspectModel from '../models/prospect';
import ProspectRefModel, { ProspectRef } from '../models/prospectRef';
import UserModel from '../models/user';
import UserRefModel from '../models/userRef';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const existingUser = await UserRefModel.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(500).json({
        error: 'Email já cadastrado na plataforma',
      });
    }
    const newProspectRef: ProspectRef = {
      _id: req.body._id,
      email: req.body.email,
      company: req.body.company,
      active: req.body.active,
    };
    const prospectRefModel = new ProspectRefModel(newProspectRef);
    await prospectRefModel.save();
    if (process.env.GITPOD_WORKSPACE_URL) {
      return res.status(201).json({
        message: 'Prospecto cadastrado!',
      });
    } else {
      return res.redirect(307, '/api/sendmail');
    }
  } catch (err) {
    console.log('Erro de cadastro:', err);
    return res.status(500).json({
      error: 'Email já cadastrado na plataforma',
    });
  }
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

router.post('/id', (req, res, next) => {
  UserModel.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json(user ? user.company : '');
  });
});

export default router;
