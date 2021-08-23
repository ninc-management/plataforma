import * as express from 'express';
import Contractor from '../models/contractor';

const router = express.Router();

router.post('/', (req, res, next) => {
  const contractor = new Contractor(req.body.contractor);
  contractor
    .save()
    .then((savedContracotor) => {
      res.status(201).json({
        message: 'Cliente cadastrado!',
        contractor: savedContracotor,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.post('/update', async (req, res, next) => {
  await Contractor.findByIdAndUpdate(
    req.body.contractor._id,
    req.body.contractor
  );
  return res.status(200).json({
    message: 'Cliente Atualizado!',
  });
});

router.post('/all', async (req, res) => {
  const contracotrs = await Contractor.find({}).lean();
  return res.status(200).json(contracotrs);
});

export default router;
