import { ModelType } from '@typegoose/typegoose/lib/types';
import * as express from 'express';
import { isEqual } from 'lodash';

import TransactionModel, { Transaction } from '../models/transaction';
import { getModelForCompany } from '../shared/util';

const router = express.Router();

async function addTransaction(
  transactionCompanyModel: ModelType<Transaction>,
  transaction: Transaction,
  res,
  lastTransaction: Transaction
): Promise<void> {
  try {
    const transactionItem = new transactionCompanyModel(transaction);
    await transactionItem.save();
    if (isEqual(transaction, lastTransaction))
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
  const transactionCompanyModel = await getModelForCompany(companyId, TransactionModel);
  addTransaction(transactionCompanyModel, req.body.transaction, res, req.body.transaction);
});

router.post('/many', async (req, res, next) => {
  const companyId = req.headers.companyid as string;
  const transactionCompanyModel = await getModelForCompany(companyId, TransactionModel);
  const transactions = req.body.transactions as Transaction[];
  transactions.forEach((transaction) => {
    addTransaction(transactionCompanyModel, transaction, res, transactions[transactions.length - 1]);
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const transactionCompanyModel = await getModelForCompany(companyId, TransactionModel);
    const transaction = await transactionCompanyModel.findOneAndUpdate(
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
    const transactionCompanyModel = await getModelForCompany(companyId, TransactionModel);
    const transactions: Transaction[] = await transactionCompanyModel.find({});
    return res.status(200).json(transactions);
  } catch (err) {
    return res.status(500).json({
      message: 'Erro ao buscar Transações!',
      error: err,
    });
  }
});

export default router;
