const express = require('express');

const Client = require('../models/client');
const User = require('../models/user');
const UserPayment = require('../models/userPayment');
const Invoice = require('../models/invoice');
const Contract = require('../models/contract');
const Payment = require('../models/payment');

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

router.post('/addPayment', async (req, res, next) => {
  const payment = new Payment(req.body.payment);
  let savedPayment;
  await payment.save(function (err, result) {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      savedPayment = result;
    }
  });
  if (savedPayment) {
    req.body.contract.payment.push(savedPayment);
    await Contract.findOneAndUpdate(
      { _id: req.body.contract._id },
      req.body.contract.payment
    );
    res.status(200).json({
      message: 'Contrato Atualizado!',
    });
  }
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
  contracts = await Contract.find({})
    .populate({
      path: 'payments',
      populate: { path: 'payments' },
    })
    .populate({
      path: 'invoice',
      model: 'Invoice',
      populate: {
        path: 'author',
        select: { fullName: 1, profilePicture: 1 },
        model: 'User',
      },
    });
  return res.status(200).json(contracts);
});

module.exports = router;
