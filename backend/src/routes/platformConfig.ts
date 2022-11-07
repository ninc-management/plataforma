import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import PlatformConfigModel, { PlatformConfig } from '../models/platformConfig';
import { configMap } from '../shared/global';

const router = express.Router();
let requested = false;
const mutex = new Mutex();
const https = require('https');

router.post('/', async (req, res, next) => {
  const configs: PlatformConfig[] = await PlatformConfigModel.find({});
  if (configs.length > 0) {
    return res.status(500).json({
      message: 'Já existe uma configuração para a plataforma!',
    });
  }

  const config = new PlatformConfigModel(req.body.config);
  mutex.acquire().then((release) => {
    config
      .save()
      .then((savedConfig) => {
        if (requested) configMap[savedConfig._id] = cloneDeep(savedConfig.toJSON());
        release();
        return res.status(201).json({
          message: 'Configuração criada!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao criar configuração!',
          error: err,
        });
      });
  });
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const configs: PlatformConfig[] = await PlatformConfigModel.find({});
    configs.map((config) => (configMap[config._id] = cloneDeep(config)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(configMap)));
});

router.post('/update', async (req, res, next) => {
  try {
    const savedConfig = await PlatformConfigModel.findByIdAndUpdate(req.body.config._id, req.body.config, {
      upsert: false,
    });
    if (requested) {
      await mutex.runExclusive(async () => {
        configMap[req.body.config._id] = cloneDeep(savedConfig.toJSON());
      });
    }
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
