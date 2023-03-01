import { ModelType } from '@typegoose/typegoose/lib/types';
import { Mutex } from 'async-mutex';
import * as express from 'express';

import InvoiceModel, { Invoice } from '../models/invoice';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const invoiceCompanyModel = await getModelForCompany(companyId, InvoiceModel);
    const invoice = new invoiceCompanyModel(req.body.invoice);
    let count = await currentYearInvoices(invoiceCompanyModel);
    count += 1;
    invoice.code = invoice.code.replace(/-(\d+)\//g, '-' + count.toString() + '/');
    const savedInvoice = await invoice.save();
    res.status(201).json({
      message: 'Orçamento cadastrado!',
      invoice: savedInvoice,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Erro ao cadastrar orçamento!',
      error: err,
    });
  }
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const invoiceCompanyModel = await getModelForCompany(companyId, InvoiceModel);
    await invoiceCompanyModel.findByIdAndUpdate(req.body.invoice._id, req.body.invoice, {
      upsert: false,
    });
    return res.status(200).json({
      message: 'Orçamento Atualizado!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar orçamento!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const invoiceCompanyModel = await getModelForCompany(companyId, InvoiceModel);
    const invoices = await invoiceCompanyModel.find({});
    return res.status(200).json(invoices);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar orçamentos!',
      error: err,
    });
  }
});

router.post('/currentYearInvoices', async (req, res) => {
  const companyId = req.headers.companyid as string;
  const invoiceCompanyModel = await getModelForCompany(companyId, InvoiceModel);
  const accumulated = await currentYearInvoices(invoiceCompanyModel);
  return res.json({ accumulated: accumulated });
});

async function currentYearInvoices(invoiceCompanyModel: ModelType<Invoice>): Promise<number> {
  const startDate = new Date(new Date().getFullYear().toString() + '/01/01');
  const endDate = new Date(new Date().getFullYear().toString() + '/12/31');
  const filteredInvoices: Invoice[] = await invoiceCompanyModel.find({ created: { $gt: startDate, $lt: endDate } });
  return Array.from(Object.values(filteredInvoices)).length;
}

export default router;
