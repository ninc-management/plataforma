import * as express from 'express';
import InvoiceModel from '../models/invoice';
import { Invoice } from '../models/invoice';
import { Mutex } from 'async-mutex';
import { cloneDeep } from 'lodash';
import { invoicesMap } from '../shared/global';

const router = express.Router();
let requested = false;
const mutex = new Mutex();

router.post('/', async (req, res, next) => {
  const invoice = new InvoiceModel(req.body.invoice);
  mutex.acquire().then(async (release) => {
    let count = await currentYearInvoices();
    count += 1;
    invoice.code = invoice.code.replace(/-(\d+)\//g, '-' + count.toString() + '/');
    invoice
      .save()
      .then((savedInvoice) => {
        if (requested) invoicesMap[savedInvoice._id] = cloneDeep(savedInvoice.toJSON());
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
  });
});

router.post('/update', async (req, res, next) => {
  await InvoiceModel.findByIdAndUpdate(
    req.body.invoice._id,
    req.body.invoice,
    { upsert: false },
    async (err, savedInvoice) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar orçamento!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          invoicesMap[req.body.invoice._id] = cloneDeep(savedInvoice.toJSON());
        });
      }
      return res.status(200).json({
        message: 'Orçamento Atualizado!',
      });
    }
  );
});

router.post('/all', async (req, res) => {
  if (!requested) {
    const invoices: Invoice[] = await InvoiceModel.find({});
    invoices.map((invoice) => (invoicesMap[invoice._id] = cloneDeep(invoice)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(invoicesMap)));
});

router.post('/currentYearInvoices', async (req, res) => {
  const accumulated = await currentYearInvoices();
  return res.json({ accumulated: accumulated });
});

async function currentYearInvoices(): Promise<number> {
  const startDate = new Date(new Date().getFullYear().toString() + '/01/01');
  const endDate = new Date(new Date().getFullYear().toString() + '/12/31');
  const filteredInvoices: Invoice[] = await InvoiceModel.find({ created: { $gt: startDate, $lt: endDate } });
  return Array.from(Object.values(filteredInvoices)).length;
}

export default router;
