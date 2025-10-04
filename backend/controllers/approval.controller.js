import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

class ApprovalController {
  async createApprovalRule(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, percentageRequired, specificApproverId, steps } = req.body;

      const rule = await prisma.$transaction(async (tx) => {
        const approvalRule = await tx.approvalRule.create({
          data: {
            name,
            type,
            percentageRequired: percentageRequired || null,
            specificApproverId: specificApproverId || null,
            companyId: req.user.companyId
          }
        });

        if (steps && steps.length > 0) {
          await tx.approvalStep.createMany({
            data: steps.map((step, index) => ({
              approvalRuleId: approvalRule.id,
              approverId: step.approverId,
              sequence: index + 1
            }))
          });
        }

        return tx.approvalRule.findUnique({
          where: { id: approvalRule.id },
          include: {
            steps: {
              include: {
                approver: {
                  select: { id: true, name: true, email: true }
                }
              },
              orderBy: { sequence: 'asc' }
            }
          }
        });
      });

      res.status(201).json({
        message: 'Approval rule created successfully',
        rule
      });
    } catch (error) {
      next(error);
    }
  }

  async getApprovalRules(req, res, next) {
    try {
      const rules = await prisma.approvalRule.findMany({
        where: { companyId: req.user.companyId },
        include: {
          steps: {
            include: {
              approver: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { sequence: 'asc' }
          }
        }
      });

      res.json({ rules });
    } catch (error) {
      next(error);
    }
  }

  async updateApprovalRule(req, res, next) {
    try {
      const { id } = req.params;
      const { name, type, percentageRequired, specificApproverId, steps, isActive } = req.body;

      const rule = await prisma.$transaction(async (tx) => {
        const updated = await tx.approvalRule.update({
          where: { id },
          data: {
            name,
            type,
            percentageRequired,
            specificApproverId,
            isActive
          }
        });

        if (steps) {
          await tx.approvalStep.deleteMany({
            where: { approvalRuleId: id }
          });

          await tx.approvalStep.createMany({
            data: steps.map((step, index) => ({
              approvalRuleId: id,
              approverId: step.approverId,
              sequence: index + 1
            }))
          });
        }

        return tx.approvalRule.findUnique({
          where: { id },
          include: {
            steps: {
              include: {
                approver: {
                  select: { id: true, name: true, email: true }
                }
              },
              orderBy: { sequence: 'asc' }
            }
          }
        });
      });

      res.json({
        message: 'Approval rule updated successfully',
        rule
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteApprovalRule(req, res, next) {
    try {
      const { id } = req.params;

      await prisma.approvalRule.delete({ where: { id } });

      res.json({ message: 'Approval rule deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getPendingApprovals(req, res, next) {
    try {
      let expenses;

      if (req.user.role === 'MANAGER') {
        // Get expenses where this manager is the next approver
        expenses = await prisma.expense.findMany({
          where: {
            companyId: req.user.companyId,
            status: 'IN_PROGRESS',
            approvalActions: {
              some: {
                approverId: req.user.id,
                status: 'PENDING'
              }
            }
          },
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
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      } else if (req.user.role === 'ADMIN') {
        expenses = await prisma.expense.findMany({
          where: {
            companyId: req.user.companyId,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
          },
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
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
      }

      res.json({ expenses });
    } catch (error) {
      next(error);
    }
  }

  async processApproval(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenseId } = req.params;
      const { status, comments } = req.body;

      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          companyId: req.user.companyId
        },
        include: {
          user: {
            include: {
              manager: true
            }
          },
          approvalActions: {
            orderBy: { stepIndex: 'asc' }
          }
        }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Get active approval rules
      const approvalRules = await prisma.approvalRule.findMany({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        include: {
          steps: {
            orderBy: { sequence: 'asc' }
          }
        }
      });

      const result = await prisma.$transaction(async (tx) => {
        // Create approval action
        const approvalAction = await tx.approvalAction.create({
          data: {
            expenseId,
            approverId: req.user.id,
            status,
            comments,
            stepIndex: expense.currentStepIndex
          }
        });

        if (status === 'REJECTED') {
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'REJECTED' }
          });

          return { approved: false, rejected: true, expense };
        }

        // Check approval logic
        const approved = await this.checkApprovalLogic(
          expense,
          approvalRules,
          tx
        );

        if (approved) {
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'APPROVED' }
          });

          return { approved: true, expense };
        }

        // Move to next step
        await tx.expense.update({
          where: { id: expenseId },
          data: {
            status: 'IN_PROGRESS',
            currentStepIndex: expense.currentStepIndex + 1
          }
        });

        return { approved: false, expense };
      });

      res.json({
        message: result.approved 
          ? 'Expense approved successfully' 
          : result.rejected 
            ? 'Expense rejected' 
            : 'Approval recorded, waiting for next approver',
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async checkApprovalLogic(expense, rules, tx) {
    const actions = await tx.approvalAction.findMany({
      where: {
        expenseId: expense.id,
        status: 'APPROVED'
      }
    });

    for (const rule of rules) {
      if (rule.type === 'SPECIFIC_APPROVER') {
        const specificApproval = actions.find(
          a => a.approverId === rule.specificApproverId
        );
        if (specificApproval) return true;
      }

      if (rule.type === 'PERCENTAGE') {
        const totalApprovers = rule.steps.length;
        const approvedCount = actions.length;
        const percentage = (approvedCount / totalApprovers) * 100;
        
        if (percentage >= rule.percentageRequired) return true;
      }

      if (rule.type === 'SEQUENTIAL') {
        const currentStep = rule.steps[expense.currentStepIndex];
        if (currentStep && expense.currentStepIndex >= rule.steps.length - 1) {
          return true;
        }
      }

      if (rule.type === 'HYBRID') {
        const specificApproval = actions.find(
          a => a.approverId === rule.specificApproverId
        );
        
        const totalApprovers = rule.steps.length;
        const approvedCount = actions.length;
        const percentage = (approvedCount / totalApprovers) * 100;
        
        if (specificApproval || percentage >= rule.percentageRequired) {
          return true;
        }
      }
    }

    return false;
  }
}

export default new ApprovalController();
