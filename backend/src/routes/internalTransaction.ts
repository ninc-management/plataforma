import { ModelType } from '@typegoose/typegoose/lib/types';
import * as express from 'express';
import { isEqual } from 'lodash';

import InternalTransactionModel, { InternalTransaction } from '../models/internalTransaction';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

async function addInternalTransaction(
  internalTransactionCompanyModel: ModelType<InternalTransaction>,
  transaction: InternalTransaction,
  res,
  lastInternalTransaction: InternalTransaction
): Promise<void> {
  try {
    const transactionItem = new internalTransactionCompanyModel(transaction);
    await transactionItem.save();
    if (isEqual(transaction, lastInternalTransaction))
      return res.status(201).json({
        message: res.req.url === '/' ? 'Transação cadastrada!' : 'Transações cadastradas!',
      });
  } catch (err) {
    return res.status(500).json({
      message: res.req.url === '/' ? 'Erro ao cadastrar transação!' : 'Erro ao cadastrar transações!',
      error: err,
    });
  }
}

router.post('/', async (req, res, next) => {
  const companyId = req.headers.companyid as string;
  const internalTransactionCompanyModel = await getModelForCompany(companyId, InternalTransactionModel);
  addInternalTransaction(internalTransactionCompanyModel, req.body.transaction, res, req.body.transaction);
});

router.post('/many', async (req, res, next) => {
  const companyId = req.headers.companyid as string;
  const internalTransactionCompanyModel = await getModelForCompany(companyId, InternalTransactionModel);
  const transactions = req.body.transactions as InternalTransaction[];
  transactions.forEach((transaction) => {
    addInternalTransaction(internalTransactionCompanyModel, transaction, res, transactions[transactions.length - 1]);
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const internalTransactionCompanyModel = await getModelForCompany(companyId, InternalTransactionModel);
    const transaction = await internalTransactionCompanyModel.findOneAndUpdate(
      { _id: req.body.transaction._id, __v: req.body.transaction.__v },
      req.body.transaction,
      { upsert: false }
    );
    if (!transaction) {
      return res.status(500).json({
        message: 'O documento foi atualizado por outro usuário. Por favor, recarregue os dados e tente novamente.',
      });
    }
    return res.status(200).json({
      message: 'Transação Atualizada!',
    });
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao atualizar Transação!',
      error: err,
    });
  }
});

router.post('/all', async (req, res) => {
  try {
    const companyId = req.headers.companyid as string;
    const internalTransactionCompanyModel = await getModelForCompany(companyId, InternalTransactionModel);
    const transactions: InternalTransaction[] = await internalTransactionCompanyModel.find({});
    return res.status(200).json(transactions);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar Transações!',
      error: err,
    });
  }
});

export default router;
