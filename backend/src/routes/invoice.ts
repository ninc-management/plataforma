import * as express from 'express';
import Invoice from '../models/invoice';

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
  await Invoice.findByIdAndUpdate(
    req.body.invoice._id,
    req.body.invoice,
    { upsert: false, new: false },
    function (err, response) {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar orçamento!',
          error: err,
        });
      return res.status(200).json({
        message: 'Orçamento Atualizado!',
      });
    }
  );
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
  const invoices = await Invoice.find({}).lean();
  return res.status(200).json(invoices);
});

export default router;
