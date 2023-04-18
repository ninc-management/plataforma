import * as express from 'express';

import ProspectModel, { Prospect } from '../models/prospect';
import ProspectRefModel, { ProspectRef } from '../models/prospectRef';
import UserModel from '../models/user';
import UserRefModel from '../models/userRef';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const existingUser = await UserRefModel.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(500).json({
        error: 'Email já cadastrado na plataforma',
      });
    }
    const newProspectRef: ProspectRef = new ProspectRef();
    newProspectRef.email = req.body.email;
    newProspectRef.company = req.body.company;
    newProspectRef.active = req.body.active;
    const prospectRefModel = new ProspectRefModel(newProspectRef);
    const savedProspectRef = await prospectRefModel.save();

    const newProspect: Prospect = req.body;
    newProspect._id = savedProspectRef._id;
    const companyId = req.headers.companyid as string;
    const prospectCompanyModel = await getModelForCompany(companyId, ProspectModel);
    const prospectModel = new prospectCompanyModel(newProspect);
    await prospectModel.save();

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
  UserRefModel.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json(!!user);
  });
});

router.post('/isProspect', (req, res, next) => {
  ProspectRefModel.findOne({ email: req.body.email }).then((prospect) => {
    res.status(200).json(!!prospect);
  });
});

router.post('/isActive', (req, res, next) => {
  UserRefModel.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json(user ? user.active : false);
  });
});

router.post('/id', (req, res, next) => {
  UserRefModel.findOne({ email: req.body.email }).then((user) => {
    res.status(200).json(user ? user.company : '');
  });
});

export default router;
