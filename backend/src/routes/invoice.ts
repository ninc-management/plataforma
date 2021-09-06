import * as express from 'express';
import InvoiceModel from '../models/invoice';
import { Invoice } from '../models/invoice';
import { Mutex } from 'async-mutex';

const router = express.Router();
let requested = false;
const invoicesMap: Record<string, Invoice> = {};
const mutex = new Mutex();

router.post('/', (req, res, next) => {
  const invoice = new InvoiceModel(req.body.invoice);
  mutex.acquire().then((release) => {
    InvoiceModel.estimatedDocumentCount({}, async (err, result) => {
      if (err) {
        release();
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
            if (requested)
              invoicesMap[savedInvoice._id] = savedInvoice.toJSON();
            release();
            res.status(201).json({
              message: 'Orçamento cadastrado!',
              invoice: savedInvoice,
            });
          })
          .catch((err) => {
            release();
            res.status(500).json({
              message: 'Erro ao cadastrar orçamento!',
              error: err,
            });
          });
      }
    });
  });
});

router.post('/update', async (req, res, next) => {
  await InvoiceModel.findByIdAndUpdate(
    req.body.invoice._id,
    req.body.invoice,
    { upsert: false, new: false },
    async (err, savedInvoice) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar orçamento!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          invoicesMap[req.body.invoice._id] = savedInvoice.toJSON();
        });
      }
      return res.status(200).json({
        message: 'Orçamento Atualizado!',
      });
    }
  );
});

router.post('/count', (req, res) => {
  res.json({
    size: Array.from(Object.values(invoicesMap)).length,
  });
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const invoices: Invoice[] = await InvoiceModel.find({});
    invoices.map((invoice) => (invoicesMap[invoice._id] = invoice));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(invoicesMap)));
});

export default router;
