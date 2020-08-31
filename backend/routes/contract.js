const express = require('express');

const Contractor = require('../models/contractor');
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

router.post('/addPayment', (req, res, next) => {
  const payment = new Payment(req.body.payment);
  let savedPayment;
  payment
    .save()
    .then((savedPaymentDB) => {
      savedPayment = savedPaymentDB;
      for (uP of req.body.team) {
        uP.payment = savedPayment._id;
      }
      return UserPayment.insertMany(req.body.team);
    })
    .then((savedUserPayments) => {
      savedPayment.team = savedUserPayments;
      return Payment.findOneAndUpdate(
        { _id: savedPayment._id },
        { team: savedUserPayments.map((uP) => uP._id) }
      );
    })
    .then(() => {
      Contract.findById(savedPayment.contract, function (err, doc) {
        if (err) {
          throw err;
        }
        doc.payments.push(savedPayment._id);
        doc.save().then(() => {
          res.status(200).json({
            message: 'Pagamento adicionado!',
            payment: savedPayment,
          });
        });
      });
    })
    .catch((err) => {
      res.status(500).json({
        message: 'Erro au adicionar pagamento e atualizar contrato!',
        error: err,
      });
    });
});

router.post('/addColaboratorPayment', async (req, res, next) => {
  const userPayment = new UserPayment(req.body.userPayment);
  await userPayment.save(function (err, result) {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      res.status(200).json({
        message: 'Pagamento de colaborador adicionado!',
        userPayment: result,
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

router.post('/updatePayment', async (req, res, next) => {
  await Payment.findOneAndUpdate(
    { _id: req.body.payment._id },
    req.body.payment
  );
  return res.status(200).json({
    message: 'Ordem de Empenho Atualizada!',
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
  contracts = await Contract.find({})
    .populate({
      path: 'payments',
      model: 'Payment',
      populate: {
        path: 'team',
        model: 'UserPayment',
        populate: {
          path: 'user',
          select: { fullName: 1, profilePicture: 1 },
          model: 'User',
        },
      },
    })
    .populate({
      path: 'invoice',
      model: 'Invoice',
      populate: [
        {
          path: 'author',
          select: { fullName: 1, profilePicture: 1 },
          model: 'User',
        },
        {
          path: 'contractor',
          model: 'Contractor',
        },
      ],
    });
  return res.status(200).json(contracts);
});

module.exports = router;
