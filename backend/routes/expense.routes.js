import express from 'express';
import { body } from 'express-validator';
import ExpenseController from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', upload.single('receipt'), [
  body('description').trim().notEmpty(),
  body('amount').isFloat({ min: 0 }),
  body('currency').notEmpty(),
  body('expenseDate').isISO8601(),
  body('paidBy').notEmpty(),
  body('categoryId').notEmpty(),
], ExpenseController.createExpense);

router.post('/ocr', upload.single('receipt'), ExpenseController.processReceiptOCR);

router.get('/', ExpenseController.getExpenses);

router.get('/:id', ExpenseController.getExpenseById);

router.put('/:id', upload.single('receipt'), ExpenseController.updateExpense);

router.delete('/:id', ExpenseController.deleteExpense);

router.get('/user/:userId', ExpenseController.getUserExpenses);

export default router;
