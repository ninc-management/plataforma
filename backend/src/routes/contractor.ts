import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep } from 'lodash';

import ContractorModel, { Contractor } from '../models/contractor';
import { contractorsMap } from '../shared/global';

const router = express.Router();
let requested = false;
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const contractor = new ContractorModel(req.body.contractor);
  mutex.acquire().then((release) => {
    contractor
      .save()
      .then((savedContractor) => {
        if (requested) contractorsMap[savedContractor._id] = cloneDeep(savedContractor.toJSON());
        release();
        res.status(201).json({
          message: 'Cliente cadastrado!',
        });
      })
      .catch((err) => {
        release();
        res.status(500).json({
          message: 'Erro ao cadastrar cliente!',
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const savedContractor = await ContractorModel.findOneAndUpdate(
      { _id: req.body.contractor._id, __v: req.body.contractor.__v },
      req.body.contractor,
      { upsert: false }
    );
    if (!savedContractor)
      return res.status(500).json({
        message: 'O documento foi atualizado por outro usuário. Por favor, reabra o documento e tente novamente.',
      });

    if (requested) {
      await mutex.runExclusive(async () => {
        contractorsMap[req.body.contractor._id] = cloneDeep(savedContractor.toJSON());
      });
    }
    return res.status(200).json({
      message: 'Cliente Atualizado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar cliente!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const contractors: Contractor[] = await ContractorModel.find({});
    contractors.map((contractor) => (contractorsMap[contractor._id] = cloneDeep(contractor)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(contractorsMap)));
});

export default router;
