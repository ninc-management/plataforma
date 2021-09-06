import * as express from 'express';
import ExpenseModel from '../models/expense';
import { Expense } from '../models/expense';
import { Mutex } from 'async-mutex';

const router = express.Router();
let requested = false;
const expensesMap: Record<string, Expense> = {};
const mutex = new Mutex();

router.post('/expense', (req, res, next) => {
  delete req.body.expense._id;
  const expense = new ExpenseModel(req.body.expense);
  mutex.acquire().then((release) => {
    expense
      .save()
      .then((savedExpense) => {
        if (requested) expensesMap[savedExpense._id] = savedExpense.toJSON();
        release();
        return res.status(201).json({
          message: 'Gasto cadastrado!',
        });
      })
      .catch((err) => {
        release();
        return res.status(500).json({
          message: 'Erro ao cadastrar gasto administrativo!',
          error: err,
        });
      });
  });
});

router.post('/updateExpense', async (req, res, next) => {
  await ExpenseModel.findByIdAndUpdate(
    req.body.expense._id,
    req.body.expense,
    { upsert: false, new: false },
    async (err, savedExpense) => {
      if (err)
        return res.status(500).json({
          message: 'Erro ao atualizar gasto administrativo!',
          error: err,
        });
      if (requested) {
        await mutex.runExclusive(async () => {
          expensesMap[req.body.expense._id] = savedExpense.toJSON();
        });
      }
      return res.status(200).json({
        message: 'Gasto Atualizado!',
      });
    }
  );
});

router.post('/allExpenses', async (req, res) => {
  if (!requested) {
    const expenses: Expense[] = await ExpenseModel.find({});
    expenses.map((expense) => (expensesMap[expense._id] = expense));
    requested = true;
  }
  return res.status(200).json(Array.from(Object.values(expensesMap)));
});

export default router;
