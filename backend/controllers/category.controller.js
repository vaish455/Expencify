import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

class CategoryController {
  async createCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name } = req.body;

      const category = await prisma.category.create({
        data: {
          name,
          companyId: req.user.companyId
        }
      });

      res.status(201).json({
        message: 'Category created successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await prisma.category.findMany({
        where: { companyId: req.user.companyId },
        orderBy: { name: 'asc' }
      });

      res.json({ categories });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const category = await prisma.category.update({
        where: { id },
        data: { name }
      });

      res.json({
        message: 'Category updated successfully',
        category
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const expenseCount = await prisma.expense.count({
        where: { categoryId: id }
      });

      if (expenseCount > 0) {
        return res.status(400).json({
          error: 'Cannot delete category with associated expenses'
        });
      }

      await prisma.category.delete({ where: { id } });

      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
