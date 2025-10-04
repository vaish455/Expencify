import prisma from '../config/database.js';

class CompanyController {
  async getCompany(req, res, next) {
    try {
      const company = await prisma.company.findUnique({
        where: { id: req.user.companyId },
        include: {
          _count: {
            select: {
              users: true,
              expenses: true
            }
          }
        }
      });

      res.json({ company });
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(req, res, next) {
    try {
      const { name, country, currency } = req.body;

      const company = await prisma.company.update({
        where: { id: req.user.companyId },
        data: { name, country, currency }
      });

      res.json({
        message: 'Company updated successfully',
        company
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req, res, next) {
    try {
      const companyId = req.user.companyId;

      const [
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        totalUsers,
        totalAmount
      ] = await Promise.all([
        prisma.expense.count({ where: { companyId } }),
        prisma.expense.count({ where: { companyId, status: 'PENDING' } }),
        prisma.expense.count({ where: { companyId, status: 'APPROVED' } }),
        prisma.expense.count({ where: { companyId, status: 'REJECTED' } }),
        prisma.user.count({ where: { companyId } }),
        prisma.expense.aggregate({
          where: { companyId, status: 'APPROVED' },
          _sum: { amountInCompanyCurrency: true }
        })
      ]);

      // Get expenses by category
      const expensesByCategory = await prisma.expense.groupBy({
        by: ['categoryId'],
        where: { companyId },
        _count: { id: true },
        _sum: { amountInCompanyCurrency: true }
      });

      const categoriesWithStats = await Promise.all(
        expensesByCategory.map(async (item) => {
          const category = await prisma.category.findUnique({
            where: { id: item.categoryId }
          });
          return {
            category: category?.name,
            count: item._count.id,
            total: item._sum.amountInCompanyCurrency
          };
        })
      );

      // Get recent expenses
      const recentExpenses = await prisma.expense.findMany({
        where: { companyId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true }
          },
          category: {
            select: { name: true }
          }
        }
      });

      res.json({
        statistics: {
          totalExpenses,
          pendingExpenses,
          approvedExpenses,
          rejectedExpenses,
          totalUsers,
          totalAmount: totalAmount._sum.amountInCompanyCurrency || 0,
          expensesByCategory: categoriesWithStats,
          recentExpenses
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CompanyController();
