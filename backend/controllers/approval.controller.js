import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

class ApprovalController {
  async createApprovalRule(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, type, percentageRequired, specificApproverId, steps, priority, requiresManagerFirst } = req.body;

      const rule = await prisma.$transaction(async (tx) => {
        const approvalRule = await tx.approvalRule.create({
          data: {
            name,
            type,
            percentageRequired: percentageRequired || null,
            specificApproverId: specificApproverId || null,
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
      const { name, type, percentageRequired, specificApproverId, steps, isActive, priority, requiresManagerFirst } = req.body;

      const rule = await prisma.$transaction(async (tx) => {
        const updated = await tx.approvalRule.update({
          where: { id },
          data: {
            name,
            type,
            percentageRequired,
            specificApproverId,
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

  async getPendingApprovals(req, res, next) {
    try {
      let expenses;

      if (req.user.role === 'MANAGER') {
        // Get expenses where this manager needs to approve
        const managerExpenses = await prisma.expense.findMany({
          where: {
            companyId: req.user.companyId,
            OR: [
              // Expenses from their team requiring manager approval
              {
                user: {
                  managerId: req.user.id,
                  isManagerApprover: true
                },
                managerApprovalComplete: false,
                status: { in: ['PENDING', 'IN_PROGRESS'] }
              },
              // Expenses in approval workflow where they are next approver
              {
                status: 'IN_PROGRESS',
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
          include: {
            category: true,
            user: {
              select: { id: true, name: true, email: true, manager: { select: { id: true, name: true } } }
            },
            company: {
              select: { currency: true }
            },
            approvalActions: {
              include: {
                approver: {
                  select: { id: true, name: true, email: true, role: true }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        expenses = managerExpenses;
      } else if (req.user.role === 'ADMIN') {
        expenses = await prisma.expense.findMany({
          where: {
            companyId: req.user.companyId,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
          },
          include: {
            category: true,
            user: {
              select: { id: true, name: true, email: true, manager: { select: { id: true, name: true } } }
            },
            company: {
              select: { currency: true }
            },
            approvalActions: {
              include: {
                approver: {
                  select: { id: true, name: true, email: true, role: true }
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
            include: {
              approver: true
            },
            orderBy: { stepIndex: 'asc' }
          }
        }
      });

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Check if user is authorized to approve this expense
      const isManager = expense.user.managerId === req.user.id;
      const hasApprovalAction = expense.approvalActions.some(
        action => action.approverId === req.user.id && action.status === 'PENDING'
      );

      if (!isManager && !hasApprovalAction && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to approve this expense' });
      }

      // Get active approval rules
      const approvalRules = await prisma.approvalRule.findMany({
        where: {
          companyId: req.user.companyId,
          isActive: true
        },
        include: {
          steps: {
            include: {
              approver: true
            },
            orderBy: { sequence: 'asc' }
          },
          specificApprover: true
        },
        orderBy: { priority: 'desc' }
      });

      const result = await prisma.$transaction(async (tx) => {
        // Handle Manager Approval First
        if (expense.user.isManagerApprover && !expense.managerApprovalComplete) {
          if (isManager || req.user.role === 'ADMIN') {
            // Create manager approval action
            await tx.approvalAction.create({
              data: {
                expenseId,
                approverId: req.user.id,
                status,
                comments,
                stepIndex: -1 // Manager approval is step -1
              }
            });

            if (status === 'REJECTED') {
              await tx.expense.update({
                where: { id: expenseId },
                data: { status: 'REJECTED' }
              });
              return { approved: false, rejected: true, message: 'Expense rejected by manager' };
            }

            // Manager approved, mark as complete and initialize workflow
            await tx.expense.update({
              where: { id: expenseId },
              data: {
                managerApprovalComplete: true,
                status: 'IN_PROGRESS'
              }
            });

            // Create pending approval actions for the workflow
            await this.initializeApprovalWorkflow(expenseId, approvalRules, tx);

            return {
              approved: false,
              managerApproved: true,
              message: 'Manager approval complete. Expense moved to approval workflow.'
            };
          } else {
            return res.status(403).json({ error: 'Manager must approve this expense first' });
          }
        }

        // Handle Workflow Approvals
        const currentAction = expense.approvalActions.find(
          action => action.approverId === req.user.id && action.status === 'PENDING'
        );

        if (!currentAction && req.user.role !== 'ADMIN') {
          return res.status(403).json({ error: 'No pending approval action found for you' });
        }

        // Update or create approval action
        if (currentAction) {
          await tx.approvalAction.update({
            where: { id: currentAction.id },
            data: {
              status,
              comments
            }
          });
        } else {
          // Admin can approve even without a specific action
          await tx.approvalAction.create({
            data: {
              expenseId,
              approverId: req.user.id,
              status,
              comments,
              stepIndex: expense.currentStepIndex
            }
          });
        }

        if (status === 'REJECTED') {
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'REJECTED' }
          });
          return { approved: false, rejected: true, message: 'Expense rejected' };
        }

        // Check if expense should be approved based on rules
        const shouldApprove = await this.evaluateApprovalRules(
          expenseId,
          approvalRules,
          tx
        );

        if (shouldApprove.approved) {
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'APPROVED' }
          });
          return { approved: true, message: shouldApprove.reason };
        }

        // Move to next step if sequential
        const sequentialRule = approvalRules.find(r => r.type === 'SEQUENTIAL');
        if (sequentialRule) {
          const nextStep = sequentialRule.steps[expense.currentStepIndex + 1];
          if (nextStep) {
            // Create pending action for next approver
            await tx.approvalAction.create({
              data: {
                expenseId,
                approverId: nextStep.approverId,
                status: 'PENDING',
                stepIndex: expense.currentStepIndex + 1
              }
            });

            await tx.expense.update({
              where: { id: expenseId },
              data: {
                currentStepIndex: expense.currentStepIndex + 1
              }
            });

            return {
              approved: false,
              message: `Approval recorded. Forwarded to ${nextStep.approver.name} for next approval.`
            };
          }
        }

        return { approved: false, message: 'Approval recorded, waiting for more approvals' };
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async initializeApprovalWorkflow(expenseId, rules, tx) {
    // Create pending approval actions based on rules
    const allApprovers = new Set();

    for (const rule of rules) {
      if (rule.type === 'SEQUENTIAL') {
        // For sequential, only add first approver
        if (rule.steps.length > 0) {
          allApprovers.add(rule.steps[0].approverId);
        }
      } else if (rule.type === 'PERCENTAGE' || rule.type === 'HYBRID') {
        // Add all approvers in steps
        rule.steps.forEach(step => allApprovers.add(step.approverId));
      } else if (rule.type === 'SPECIFIC_APPROVER' && rule.specificApproverId) {
        allApprovers.add(rule.specificApproverId);
      }
    }

    // Create pending actions
    const actions = Array.from(allApprovers).map((approverId, index) => ({
      expenseId,
      approverId,
      status: 'PENDING',
      stepIndex: 0
    }));

    if (actions.length > 0) {
      await tx.approvalAction.createMany({ data: actions });
    }
  }

  async evaluateApprovalRules(expenseId, rules, tx) {
    const approvedActions = await tx.approvalAction.findMany({
      where: {
        expenseId,
        status: 'APPROVED'
      },
      include: {
        approver: true
      }
    });

    const approverIds = approvedActions.map(a => a.approverId);

    // Check each rule (sorted by priority)
    for (const rule of rules) {
      // SPECIFIC_APPROVER: If specific person approved, auto-approve
      if (rule.type === 'SPECIFIC_APPROVER') {
        if (rule.specificApproverId && approverIds.includes(rule.specificApproverId)) {
          return {
            approved: true,
            reason: `Auto-approved by specific approver: ${rule.specificApprover.name}`
          };
        }
      }

      // PERCENTAGE: Check if required percentage met
      if (rule.type === 'PERCENTAGE') {
        const totalApprovers = rule.steps.length;
        const approvedCount = rule.steps.filter(step =>
          approverIds.includes(step.approverId)
        ).length;
        const percentage = totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0;

        if (percentage >= rule.percentageRequired) {
          return {
            approved: true,
            reason: `Approved by ${percentage.toFixed(0)}% of approvers (required: ${rule.percentageRequired}%)`
          };
        }
      }

      // SEQUENTIAL: Check if all steps completed
      if (rule.type === 'SEQUENTIAL') {
        const allStepsApproved = rule.steps.every(step =>
          approverIds.includes(step.approverId)
        );

        if (allStepsApproved && rule.steps.length > 0) {
          return {
            approved: true,
            reason: 'All sequential approvers have approved'
          };
        }
      }

      // HYBRID: Specific approver OR percentage
      if (rule.type === 'HYBRID') {
        // Check specific approver
        if (rule.specificApproverId && approverIds.includes(rule.specificApproverId)) {
          return {
            approved: true,
            reason: `Auto-approved by specific approver: ${rule.specificApprover.name}`
          };
        }

        // Check percentage
        const totalApprovers = rule.steps.length;
        const approvedCount = rule.steps.filter(step =>
          approverIds.includes(step.approverId)
        ).length;
        const percentage = totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0;

        if (percentage >= rule.percentageRequired) {
          return {
            approved: true,
            reason: `Approved by ${percentage.toFixed(0)}% of approvers (required: ${rule.percentageRequired}%)`
          };
        }
      }
    }

    return { approved: false };
  }
}

export default new ApprovalController();
