import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import currencyService from '../utils/currencyService.js';
import cloudinaryService from '../utils/cloudinaryService.js';
import ocrService from '../utils/ocrService.js';

class ExpenseController {
  async createExpense(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { description, amount, currency, expenseDate, paidBy, remarks, categoryId } = req.body;

      let receiptUrl = null;
      if (req.file) {
        receiptUrl = await cloudinaryService.uploadReceipt(
          req.file.buffer,
          req.file.originalname
        );
      }

      const companyCurrency = req.user.company.currency;
      const amountInCompanyCurrency = await currencyService.convert(
        parseFloat(amount),
        currency,
        companyCurrency
      );

      // Determine initial status and approval flow
      const needsManagerApproval = req.user.manager && req.user.isManagerApprover;

      const expense = await prisma.expense.create({
        data: {
          description,
          amount: parseFloat(amount),
          currency,
          amountInCompanyCurrency,
          expenseDate: new Date(expenseDate),
          paidBy,
          remarks,
          receiptUrl,
          categoryId,
          userId: req.user.id,
          companyId: req.user.companyId,
          status: needsManagerApproval ? 'PENDING' : 'IN_PROGRESS',
          managerApprovalComplete: !needsManagerApproval
        },
        include: {
          category: true,
          user: {
            select: { id: true, name: true, email: true, manager: { select: { name: true } } }
          }
        }
      });

      // If no manager approval needed, initialize workflow immediately
      if (!needsManagerApproval) {
        const approvalRules = await prisma.approvalRule.findMany({
          where: {
            companyId: req.user.companyId,
            isActive: true
          },
          include: {
            steps: {
              include: { approver: true },
              orderBy: { sequence: 'asc' }
            }
          },
          orderBy: { priority: 'desc' }
        });

        if (approvalRules.length > 0) {
          await this.initializeWorkflow(expense.id, approvalRules);
        }
      }

      res.status(201).json({
        message: needsManagerApproval 
          ? 'Expense submitted. Waiting for manager approval.' 
          : 'Expense submitted for approval.',
        expense
      });
    } catch (error) {
      next(error);
    }
  }

  async initializeWorkflow(expenseId, rules) {
    const allApprovers = new Set();

    for (const rule of rules) {
      if (rule.type === 'SEQUENTIAL' && rule.steps.length > 0) {
        allApprovers.add(rule.steps[0].approverId);
      } else if (rule.type === 'PERCENTAGE' || rule.type === 'HYBRID') {
        rule.steps.forEach(step => allApprovers.add(step.approverId));
      } else if (rule.type === 'SPECIFIC_APPROVER' && rule.specificApproverId) {
        allApprovers.add(rule.specificApproverId);
      }
    }

    const actions = Array.from(allApprovers).map(approverId => ({
      expenseId,
      approverId,
      status: 'PENDING',
      stepIndex: 0
    }));

    if (actions.length > 0) {
      await prisma.approvalAction.createMany({ data: actions });
    }
  }

  async processReceiptOCR(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Receipt image is required' });
      }

      const ocrResult = await ocrService.processReceipt(req.file.buffer);

      res.json({
        message: 'Receipt processed successfully',
        data: ocrResult
      });
    } catch (error) {
      next(error);
    }
  }

  async getExpenses(req, res, next) {
    try {
      const { status, userId, startDate, endDate } = req.query;

      const where = { companyId: req.user.companyId };

      if (req.user.role === 'EMPLOYEE') {
        where.userId = req.user.id;
      }

      if (status) where.status = status;
      if (userId) where.userId = userId;
      if (startDate || endDate) {
        where.expenseDate = {};
        if (startDate) where.expenseDate.gte = new Date(startDate);
        if (endDate) where.expenseDate.lte = new Date(endDate);
      }

      const expenses = await prisma.expense.findMany({
        where,
        include: {
          category: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          approvalActions: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ expenses });
    } catch (error) {
      next(error);
    }
  }

  async getExpenseById(req, res, next) {
    try {
      const { id } = req.params;

      const expense = await prisma.expense.findFirst({
        where: {
          id,
          companyId: req.user.companyId
        },
        include: {
          category: true,
          user: true,
          approvalActions: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          ocrData: true
        }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json({ expense });
    } catch (error) {
      next(error);
    }
  }

  async updateExpense(req, res, next) {
    try {
      const { id } = req.params;
      const { description, amount, currency, expenseDate, paidBy, remarks, categoryId } = req.body;

      const expense = await prisma.expense.findFirst({
        where: {
          id,
          userId: req.user.id,
          companyId: req.user.companyId
        }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      if (expense.status !== 'PENDING') {
        return res.status(400).json({ error: 'Cannot update expense that is being processed or completed' });
      }

      let receiptUrl = expense.receiptUrl;
      if (req.file) {
        receiptUrl = await cloudinaryService.uploadReceipt(
          req.file.buffer,
          req.file.originalname
        );
      }

      const companyCurrency = req.user.company.currency;
      const amountInCompanyCurrency = amount && currency 
        ? await currencyService.convert(parseFloat(amount), currency, companyCurrency)
        : expense.amountInCompanyCurrency;

      const updatedExpense = await prisma.expense.update({
        where: { id },
        data: {
          description,
          amount: amount ? parseFloat(amount) : expense.amount,
          currency: currency || expense.currency,
          amountInCompanyCurrency,
          expenseDate: expenseDate ? new Date(expenseDate) : expense.expenseDate,
          paidBy: paidBy || expense.paidBy,
          remarks,
          receiptUrl,
          categoryId: categoryId || expense.categoryId
        },
        include: {
          category: true,
          user: true
        }
      });

      res.json({
        message: 'Expense updated successfully',
        expense: updatedExpense
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteExpense(req, res, next) {
    try {
      const { id } = req.params;

      const expense = await prisma.expense.findFirst({
        where: {
          id,
          userId: req.user.id,
          companyId: req.user.companyId
        }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      if (expense.status !== 'PENDING') {
        return res.status(400).json({ error: 'Cannot delete expense that is being processed or completed' });
      }

      await prisma.expense.delete({ where: { id } });

      res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getUserExpenses(req, res, next) {
    try {
      const { userId } = req.params;

      if (req.user.role === 'EMPLOYEE' && req.user.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          companyId: req.user.companyId
        },
        include: {
          category: true,
          approvalActions: {
            include: {
              approver: {
                select: { id: true, name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ expenses });
    } catch (error) {
      next(error);
    }
  }
}

export default new ExpenseController();
