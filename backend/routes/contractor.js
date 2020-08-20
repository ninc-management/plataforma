const express = require('express');

const Contractor = require('../models/contractor');

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
  await User.findByIdAndUpdate(req.body.contractor._id, req.body.contractor);
  return res.status(200).json({
    message: 'Cliente Atualizado!',
  });
});

router.post('/all', async (req, res) => {
  contracotrs = await User.find({});
  return res.status(200).json(contracotrs);
});

module.exports = router;
