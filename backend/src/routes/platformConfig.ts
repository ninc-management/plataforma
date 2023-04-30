import * as express from 'express';

import CompanyModel from '../models/company';
import PlatformConfigModel, { PlatformConfig } from '../models/platformConfig';
import { getModelForCompany } from '../shared/util';

const router = express.Router();
const https = require('https');

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const platformConfigCompanyModel = await getModelForCompany(companyId, PlatformConfigModel);
    const configs: PlatformConfig[] = await platformConfigCompanyModel.find({});
    if (configs.length > 0) {
      return res.status(500).json({
        message: 'Já existe uma configuração para a plataforma!',
      });
    }
    const config = new platformConfigCompanyModel(req.body.config);
    await config.save();
    return res.status(201).json({
      message: 'Configuração criada!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao criar configuração!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const platformConfigCompanyModel = await getModelForCompany(companyId, PlatformConfigModel);
    const configs: PlatformConfig[] = await platformConfigCompanyModel.find({});
    return res.status(200).json(configs);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao criar configuração!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const platformConfigCompanyModel = await getModelForCompany(companyId, PlatformConfigModel);
    await CompanyModel.findByIdAndUpdate(req.body.config.company._id, req.body.config.company, {
      upsert: false,
    });
    await platformConfigCompanyModel.findByIdAndUpdate(req.body.config._id, req.body.config, {
      upsert: false,
    });
    return res.status(200).json({
      message: 'Configuração atualizada!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar configuração!',
      error: err,
    });
  }
});

router.post('/colors', async (req, res, next) => {
  const painterRequestOptions = {
    hostname: 'app.uibakery.io',
    path: '/api/painter/support?primary=' + req.body.primaryColorHex,
  };

  const painterRequest = await https.get(painterRequestOptions, (painterResponse) => {
    let data = '';

    painterResponse.on('data', (chunk) => {
      data += chunk;
    });

    painterResponse.on('end', () => {
      const colors = JSON.parse(data);
      return res.status(200).json(colors);
    });
  });

  painterRequest.on('error', (err) => {
    return res.status(500).json({
      message: 'Erro ao gerar paleta de cores',
      error: err,
    });
  });

  painterRequest.end();
});

export default router;
