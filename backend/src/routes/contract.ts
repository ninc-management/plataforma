import * as express from 'express';
import Contract from '../models/contract';

const router = express.Router();

router.post('/', async (req, res, next) => {
  const contract = new Contract(req.body.contract);
  contract.save(function (err, result) {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      return res.status(201).json({
        message: 'Contrato cadastrado!',
        contract: result,
      });
    }
  });
});

router.post('/update', async (req, res, next) => {
  await Contract.findOneAndUpdate(
    { _id: req.body.contract._id },
    req.body.contract
  );
  return res.status(200).json({
    message: 'Contrato Atualizado!',
  });
});

router.post('/count', (req, res) => {
  Contract.estimatedDocumentCount({}, function (err, result) {
    if (err) {
      res.status(500).json({
        error: err,
      });
    } else {
      res.json({
        size: result,
      });
    }
  });
});

router.post('/all', async (req, res) => {
  const contracts = await Contract.find({});
  return res.status(200).json(contracts);
});

export default router;
