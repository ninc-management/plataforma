import * as express from 'express';
import ContractorModel from '../models/contractor';
import { Contractor } from '../models/contractor';
import { Mutex } from 'async-mutex';

const router = express.Router();
let requested = false;
const contractorsMap: Record<string, Contractor> = {};
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const contractor = new ContractorModel(req.body.contractor);
  mutex.acquire().then((release) => {
    contractor
      .save()
      .then((savedContractor) => {
        if (requested) {
          const tempContractor: Contractor = savedContractor.toJSON();
          contractorsMap[tempContractor._id] = tempContractor;
        }
        release();
        res.status(201).json({
          message: 'Cliente cadastrado!',
        });
      })
      .catch((err) => {
        release();
        res.status(500).json({
          error: err,
        });
      });
  });
});

router.post('/update', async (req, res, next) => {
  await ContractorModel.findByIdAndUpdate(
    req.body.contractor._id,
    req.body.contractor,
    { upsert: false, new: false },
    async (err, response) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar cliente!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          contractorsMap[req.body.contractor._id] = req.body.contractor;
        });
      }
      return res.status(200).json({
        message: 'Cliente Atualizado!',
      });
    }
  );
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const contractors: Contractor[] = await ContractorModel.find({}).lean();
    contractors.map(
      (contractor) => (contractorsMap[contractor._id] = contractor)
    );
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(contractorsMap)));
});

export default router;
