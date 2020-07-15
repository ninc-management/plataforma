const express = require('express');

const Contract = require('../models/contract');

const router = express.Router();

router.post('/', (req, res, next) => {
  const contract = new Contract(req.body.contract);
  contract
    .save()
    .then(() => {
      res.status(201).json({
        message: 'Contrato cadastrado!',
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

module.exports = router;
