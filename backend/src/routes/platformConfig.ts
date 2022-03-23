import * as express from 'express';
import { Mutex } from 'async-mutex';
import { cloneDeep } from 'lodash';
import { PlatformConfig } from '../models/platformConfig';
import PlatformConfigModel from '../models/platformConfig';

const router = express.Router();
let requested = false;
const configMap: Record<string, PlatformConfig> = {};
const mutex = new Mutex();

router.post('/', (req, res, next) => {
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
  await PlatformConfigModel.findByIdAndUpdate(
    req.body.config._id,
    req.body.config,
    { upsert: false },
    async (err, savedConfig) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar configuração!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          configMap[req.body.config._id] = cloneDeep(savedConfig.toJSON());
        });
      }
      return res.status(200).json({
        message: 'Configuração atualizada!',
      });
    }
  );
});

export default router;
