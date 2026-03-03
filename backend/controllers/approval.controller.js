import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

class ApprovalController {
  // ========================
  // CRUD for Approval Rules
  // ========================

  async createApprovalRule(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, percentageRequired, specificApproverId, categoryId, minAmount, maxAmount, steps, priority, requiresManagerFirst } = req.body;

      const rule = await prisma.$transaction(async (tx) => {
        const approvalRule = await tx.approvalRule.create({
          data: {
            name,
            type,
            percentageRequired: percentageRequired || null,
            specificApproverId: specificApproverId || null,
            categoryId: categoryId || null,
            minAmount: minAmount != null ? parseFloat(minAmount) : null,
            maxAmount: maxAmount != null ? parseFloat(maxAmount) : null,
            priority: priority || 0,
            requiresManagerFirst: requiresManagerFirst || false,
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
                  select: { id: true, name: true, email: true, role: true }
                }
              },
              orderBy: { sequence: 'asc' }
            },
            specificApprover: {
              select: { id: true, name: true, email: true, role: true }
            },
            category: {
              select: { id: true, name: true }
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
                select: { id: true, name: true, email: true, role: true }
              }
            },
            orderBy: { sequence: 'asc' }
          },
          specificApprover: {
            select: { id: true, name: true, email: true, role: true }
          },
          category: {
            select: { id: true, name: true }
          }
        },
        orderBy: { priority: 'desc' }
      });

      res.json({ rules });
    } catch (error) {
      next(error);
    }
  }

  async updateApprovalRule(req, res, next) {
    try {
      const { id } = req.params;
      const { name, type, percentageRequired, specificApproverId, categoryId, minAmount, maxAmount, steps, isActive, priority, requiresManagerFirst } = req.body;

      const rule = await prisma.$transaction(async (tx) => {
        await tx.approvalRule.update({
          where: { id },
          data: {
            name,
            type,
            percentageRequired,
            specificApproverId: specificApproverId || null,
            categoryId: categoryId || null,
            minAmount: minAmount != null ? parseFloat(minAmount) : null,
            maxAmount: maxAmount != null ? parseFloat(maxAmount) : null,
            isActive,
            priority: priority || 0,
            requiresManagerFirst: requiresManagerFirst || false
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
                  select: { id: true, name: true, email: true, role: true }
                }
              },
              orderBy: { sequence: 'asc' }
            },
            specificApprover: {
              select: { id: true, name: true, email: true, role: true }
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

  // ========================
  // Pending Approvals
  // ========================

  async getPendingApprovals(req, res, next) {
    try {
      const includeFields = {
        category: true,
        user: {
          select: {
            id: true, name: true, email: true,
            managerId: true, isManagerApprover: true,
            manager: { select: { id: true, name: true, email: true } }
          }
        },
        company: { select: { currency: true } },
        approvalActions: {
          include: {
            approver: { select: { id: true, name: true, email: true, role: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      };

      let expenses = [];

      if (req.user.role === 'ADMIN') {
        // Admin sees ALL pending/in-progress expenses
        expenses = await prisma.expense.findMany({
          where: {
            companyId: req.user.companyId,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
          },
          include: includeFields,
          orderBy: { createdAt: 'desc' }
        });
      } else if (['MANAGER', 'CEO', 'CFO', 'CTO', 'DIRECTOR'].includes(req.user.role)) {
        // Managers & Executives see:
        // 1) Expenses from their direct reports that need manager approval
        // 2) Expenses where they have a PENDING workflow ApprovalAction
        expenses = await prisma.expense.findMany({
          where: {
            companyId: req.user.companyId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            OR: [
              // Direct reports needing manager approval
              {
                user: {
                  managerId: req.user.id,
                  isManagerApprover: true
                },
                managerApprovalComplete: false
              },
              // This user has a pending approval action in the workflow
              {
                managerApprovalComplete: true,
                approvalActions: {
                  some: {
                    approverId: req.user.id,
                    status: 'PENDING'
                  }
                }
              }
            ]
          },
          include: includeFields,
          orderBy: { createdAt: 'desc' }
        });
      }

      res.json({ expenses });
    } catch (error) {
      console.error('Get Pending Approvals Error:', error);
      next(error);
    }
  }

  // ========================
  // Process Approval
  // ========================

  async processApproval(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenseId } = req.params;
      const { status, comments } = req.body;

      // Load the expense with all relationships
      const expense = await prisma.expense.findFirst({
        where: {
          id: expenseId,
          companyId: req.user.companyId
        },
        include: {
          user: { include: { manager: true } },
          approvalActions: {
            include: { approver: true },
            orderBy: { stepIndex: 'asc' }
          }
        }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Prevent re-processing finalized expenses
      if (expense.status === 'APPROVED' || expense.status === 'REJECTED') {
        return res.status(400).json({ error: 'This expense has already been finalized' });
      }

      const isAssignedManager = expense.user.managerId === req.user.id;
      const isAdmin = req.user.role === 'ADMIN';
      const pendingAction = expense.approvalActions.find(
        a => a.approverId === req.user.id && a.status === 'PENDING'
      );

      // ─── PHASE 1: Manager Approval ───
      if (expense.user.isManagerApprover && !expense.managerApprovalComplete) {
        if (!isAssignedManager && !isAdmin) {
          return res.status(403).json({
            error: 'Only the assigned manager can approve at this stage'
          });
        }

        const result = await prisma.$transaction(async (tx) => {
          // Record the manager's decision
          await tx.approvalAction.create({
            data: {
              expenseId,
              approverId: req.user.id,
              status,
              comments: comments || null,
              stepIndex: -1
            }
          });

          if (status === 'REJECTED') {
            await tx.expense.update({
              where: { id: expenseId },
              data: { status: 'REJECTED' }
            });
            return { rejected: true, message: 'Expense rejected by manager' };
          }

          // Manager approved → move to workflow phase
          await tx.expense.update({
            where: { id: expenseId },
            data: {
              managerApprovalComplete: true,
              status: 'IN_PROGRESS'
            }
          });

          // Load approval rules and initialize the workflow
          const rules = await getActiveRules(req.user.companyId, tx, expense.categoryId, expense.amount);

          if (rules.length === 0) {
            // No rules configured — auto-approve after manager
            await tx.expense.update({
              where: { id: expenseId },
              data: { status: 'APPROVED' }
            });
            return {
              approved: true,
              message: 'Expense approved (no further approval rules configured)'
            };
          }

          await initializeWorkflow(expenseId, rules, tx);
          return {
            managerApproved: true,
            message: 'Manager approved. Expense moved to approval workflow.'
          };
        });

        return res.json(result);
      }

      // ─── PHASE 2: Workflow Approval ───
      if (!pendingAction && !isAdmin) {
        return res.status(403).json({
          error: 'You do not have a pending approval action for this expense'
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Record the decision
        if (pendingAction) {
          await tx.approvalAction.update({
            where: { id: pendingAction.id },
            data: { status, comments: comments || null }
          });
        } else if (isAdmin) {
          await tx.approvalAction.create({
            data: {
              expenseId,
              approverId: req.user.id,
              status,
              comments: comments || null,
              stepIndex: 0
            }
          });
        }

        // Rejection immediately finalizes the expense
        if (status === 'REJECTED') {
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'REJECTED' }
          });
          return { rejected: true, message: 'Expense rejected' };
        }

        // Check if ALL workflow approvers have approved
        const remainingPending = await tx.approvalAction.count({
          where: {
            expenseId,
            stepIndex: { gte: 0 },
            status: 'PENDING'
          }
        });

        if (remainingPending === 0) {
          // All approvers have approved → expense is fully approved
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'APPROVED' }
          });
          return { approved: true, message: 'All approvers have approved. Expense is fully approved!' };
        }

        return {
          message: `Approval recorded. ${remainingPending} more approval(s) needed.`
        };
      });

      return res.json(result);
    } catch (error) {
      console.error('Process Approval Error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta
      });
      next(error);
    }
  }
}

// ═══════════════════════════════════
// Helper Functions
// ═══════════════════════════════════

/**
 * Get active approval rules that match the given expense's category and amount.
 * Rules match when:
 *   - categoryId is NULL (matches any) OR equals the expense category
 *   - minAmount is NULL (no minimum) OR expense amount >= minAmount
 *   - maxAmount is NULL (no maximum) OR expense amount <= maxAmount
 */
async function getActiveRules(companyId, tx, categoryId = null, amount = null) {
  const allRules = await tx.approvalRule.findMany({
    where: { companyId, isActive: true },
    include: {
      steps: {
        include: { approver: true },
        orderBy: { sequence: 'asc' }
      },
      specificApprover: true,
      category: { select: { id: true, name: true } }
    },
    orderBy: { priority: 'desc' }
  });

  // Filter rules by category and amount
  return allRules.filter(rule => {
    const categoryMatch = !rule.categoryId || rule.categoryId === categoryId;
    const minMatch = rule.minAmount == null || (amount != null && amount >= rule.minAmount);
    const maxMatch = rule.maxAmount == null || (amount != null && amount <= rule.maxAmount);
    return categoryMatch && minMatch && maxMatch;
  });
}

/**
 * Create PENDING ApprovalActions for ALL approvers from ALL active rules.
 * Every configured approver gets a PENDING action — the expense is only fully
 * approved when ALL of them have approved.
 */
async function initializeWorkflow(expenseId, rules, tx) {
  const approverIds = new Set();

  for (const rule of rules) {
    // Add all step approvers (regardless of rule type)
    if (rule.steps && rule.steps.length > 0) {
      rule.steps.forEach(step => approverIds.add(step.approverId));
    }

    // Add specific approver if set
    if (rule.specificApproverId) {
      approverIds.add(rule.specificApproverId);
    }
  }

  // Avoid duplicates with existing actions
  const existing = await tx.approvalAction.findMany({
    where: { expenseId, stepIndex: { gte: 0 } },
    select: { approverId: true }
  });
  const existingIds = new Set(existing.map(a => a.approverId));

  const actions = Array.from(approverIds)
    .filter(id => !existingIds.has(id))
    .map(approverId => ({
      expenseId,
      approverId,
      status: 'PENDING',
      stepIndex: 0
    }));

  if (actions.length > 0) {
    await tx.approvalAction.createMany({ data: actions });
  }
}

export default new ApprovalController();
