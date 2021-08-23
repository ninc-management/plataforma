import * as express from 'express';
import Expense from '../models/expense';

const router = express.Router();

router.post('/expense', async (req, res, next) => {
  delete req.body.expense._id;
  const expense = new Expense(req.body.expense);
  expense.save(function (err, result) {
    if (err) {
      return res.status(500).json({
        error: err,
      });
    } else {
      return res.status(201).json({
        message: 'Despesa cadastrada!',
        expense: result,
      });
    }
  });
});

router.post('/updateExpense', async (req, res, next) => {
  await Expense.findOneAndUpdate(
    { _id: req.body.expense._id },
    req.body.expense
  );
  return res.status(200).json({
    message: 'Despesa Atualizada!',
  });
});

router.post('/allExpenses', async (req, res) => {
  const expenses = await Expense.find({}).lean();
  return res.status(200).json(expenses);
});

export default router;
