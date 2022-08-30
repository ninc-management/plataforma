import { Mutex } from 'async-mutex';
import * as express from 'express';
import { cloneDeep, isEqual } from 'lodash';

import InternalTransactionModel, { InternalTransaction } from '../models/internalTransaction';

const router = express.Router();
let requested = false;
const internalTransactionsMap: Record<string, InternalTransaction> = {};
const mutex = new Mutex();

function addTransaction(internalTransaction: InternalTransaction, res, lastTransaction: InternalTransaction): void {
  const transactionItem = new InternalTransactionModel(internalTransaction);
  mutex.acquire().then((release) => {
    transactionItem
      .save()
      .then((savedTransaction) => {
        if (requested) internalTransactionsMap[savedTransaction._id] = cloneDeep(savedTransaction.toJSON());
        release();
        if (isEqual(internalTransaction, lastTransaction))
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
  addTransaction(req.body.internalTransaction, res, req.body.internalTransaction);
});

router.post('/many', (req, res, next) => {
  const transactions = req.body.transactions as InternalTransaction[];
  transactions.forEach((internalTransaction) => {
    addTransaction(internalTransaction, res, transactions[transactions.length - 1]);
  });
});

router.post('/update', async (req, res, next) => {
  try {
    const savedTransaction = await InternalTransactionModel.findByIdAndUpdate(
      req.body.internalTransaction._id,
      req.body.internalTransaction,
      { upsert: false }
    );
    if (requested) {
      await mutex.runExclusive(async () => {
        internalTransactionsMap[req.body.internalTransaction._id] = cloneDeep(savedTransaction.toJSON());
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
    const transactions: InternalTransaction[] = await InternalTransactionModel.find({});
    transactions.map(
      (internalTransaction) => (internalTransactionsMap[internalTransaction._id] = cloneDeep(internalTransaction))
    );
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(internalTransactionsMap)));
});

export default router;
