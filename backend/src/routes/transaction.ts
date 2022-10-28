import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep, isEqual } from 'lodash';

import { TransactionModel } from '../models/models';
import { Transaction } from '../models/transaction';

const router = express.Router();
let requested = false;
const transactionsMap: Record<string, Transaction> = {};
const mutex = new Mutex();

function addTransaction(transaction: Transaction, res, lastTransaction: Transaction): void {
  const transactionItem = new TransactionModel(transaction);
  mutex.acquire().then((release) => {
    transactionItem
      .save()
      .then((savedTransaction) => {
        if (requested) transactionsMap[savedTransaction._id] = cloneDeep(savedTransaction.toJSON());
        release();
        if (isEqual(transaction, lastTransaction))
          return res.status(201).json({
            message: res.req.url === '/' ? 'Transação cadastrada!' : 'Transações cadastradas!',
          });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: res.req.url === '/' ? 'Erro ao cadastrar transação!' : 'Erro ao cadastrar transações!',
          error: err,
        });
      });
  });
}

router.post('/', (req, res, next) => {
  addTransaction(req.body.transaction, res, req.body.transaction);
});

router.post('/many', (req, res, next) => {
  const transactions = req.body.transactions as Transaction[];
  transactions.forEach((transaction) => {
    addTransaction(transaction, res, transactions[transactions.length - 1]);
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const savedTransaction = await TransactionModel.findByIdAndUpdate(req.body.transaction._id, req.body.transaction, {
      upsert: false,
    });
    if (requested) {
      await mutex.runExclusive(async () => {
        transactionsMap[req.body.transaction._id] = cloneDeep(savedTransaction.toJSON());
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
  if (!requested) {
    const transactions: Transaction[] = await TransactionModel.find({});
    transactions.map((transaction) => (transactionsMap[transaction._id] = cloneDeep(transaction)));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(transactionsMap)));
});

export default router;
