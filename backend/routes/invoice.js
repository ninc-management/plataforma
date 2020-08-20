const express = require('express');

const Contractor = require('../models/contractor');
const Contract = require('../models/contract');
const Invoice = require('../models/invoice');
const User = require('../models/user');

const router = express.Router();

router.post('/', (req, res, next) => {
  const invoice = new Invoice(req.body.invoice);
  invoice
    .save()
    .then((savedInvoice) => {
      res.status(201).json({
        message: 'Orçamento cadastrado!',
        invoice: savedInvoice,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});

router.post('/update', async (req, res, next) => {
  await Invoice.findOneAndUpdate(
    { _id: req.body.invoice._id },
    req.body.invoice
  );
  return res.status(200).json({
    message: 'Orçamento Atualizado!',
  });
});

router.post('/count', (req, res) => {
  Invoice.estimatedDocumentCount({}, function (err, result) {
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
  invoices = await Invoice.find({})
    .populate('author', 'fullName profilePicture')
    .populate('contractor');
  return res.status(200).json(invoices);
});

module.exports = router;
