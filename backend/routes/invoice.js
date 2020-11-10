const express = require('express');

const Contractor = require('../models/contractor');
const Contract = require('../models/contract');
const Invoice = require('../models/invoice');
const User = require('../models/user');
const UserExpertise = require('../models/userExpertise');
const TeamMember = require('../models/teamMember');

const router = express.Router();

router.post('/', (req, res, next) => {
  let invoice = new Invoice(req.body.invoice);
  Invoice.estimatedDocumentCount({}, function (err, result) {
    if (err) {
      res.status(500).json({
        error: err,
      });
    } else {
      const count = result + 1;
      invoice.code = invoice.code.replace(
        /-(\d+)\//g,
        '-' + count.toString() + '/'
      );
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
    }
  });
});

router.post('/update', async (req, res, next) => {
  // Handle team
  if (req.body.invoice.team.length > 0) {
    TeamMember.deleteMany({ invoice: req.body.invoice._id })
      .then(() => {
        return TeamMember.bulkWrite(
          req.body.invoice.team.map((member) => {
            if (member.invoice == undefined)
              member.invoice = req.body.invoice._id;
            return {
              insertOne: {
                document: member,
              },
            };
          })
        );
      })
      .then(() => {
        return TeamMember.find({ invoice: req.body.invoice._id });
      })
      .then((savedTeam) => {
        req.body.invoice.team = savedTeam.map((el) => el._id);
        return Invoice.findOneAndUpdate(
          { _id: req.body.invoice._id },
          req.body.invoice,
          function (err) {
            if (err) throw err;
            else {
              res.status(200).json({
                message: 'Orçamento Atualizado!',
              });
            }
          }
        );
      })
      .catch((err) => {
        res.status(500).json({
          message:
            'Erro ao adicionar e atualizar time enquanto atualiza o orçamento!',
          error: err,
        });
      });
  } else {
    // Update Invoice
    await Invoice.findOneAndUpdate(
      { _id: req.body.invoice._id },
      req.body.invoice
    );
    return res.status(200).json({
      message: 'Orçamento Atualizado!',
    });
  }
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
    .populate({
      path: 'author',
      model: 'User',
      select: {
        fullName: 1,
        profilePicture: 1,
        exibitionName: 1,
        phone: 1,
        emailNortan: 1,
        article: 1,
        education: 1,
        level: 1,
        expertise: 1,
      },
      populate: {
        path: 'expertise',
        model: 'UserExpertise',
      },
    })
    .populate({
      path: 'team',
      model: 'TeamMember',
      populate: {
        path: 'user',
        model: 'User',
        select: {
          fullName: 1,
          profilePicture: 1,
          exibitionName: 1,
          expertise: 1,
          level: 1,
        },
        populate: {
          path: 'expertise',
          model: 'UserExpertise',
        },
      },
    })
    .populate('contractor');
  return res.status(200).json(invoices);
});

module.exports = router;
