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
      let expenses = [];

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
              select: { id: true, name: true, email: true, managerId: true, isManagerApprover: true, manager: { select: { id: true, name: true } } }
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
              select: { id: true, name: true, email: true, managerId: true, isManagerApprover: true, manager: { select: { id: true, name: true } } }
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

      res.json({ expenses: expenses || [] });
    } catch (error) {
      console.error('Get Pending Approvals Error:', error);
      next(error);
    }
  }

  async processApproval(req, res, next) {
    try {
      console.log('Processing approval:', { expenseId: req.params.expenseId, userId: req.user.id, body: req.body });
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
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

      console.log('Found expense:', { id: expense?.id, status: expense?.status, managerApprovalComplete: expense?.managerApprovalComplete });

      if (!expense) {
        console.error('Expense not found:', expenseId);
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Check if user is authorized to approve this expense
      const isManager = expense.user.managerId === req.user.id;
      const hasApprovalAction = expense.approvalActions.some(
        action => action.approverId === req.user.id && action.status === 'PENDING'
      );

      console.log('Authorization check:', { isManager, hasApprovalAction, userRole: req.user.role });

      if (!isManager && !hasApprovalAction && req.user.role !== 'ADMIN') {
        console.error('Unauthorized approval attempt');
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

      console.log('Found approval rules:', approvalRules.length);

      const result = await prisma.$transaction(async (tx) => {
        // Handle Manager Approval First
        if (expense.user.isManagerApprover && !expense.managerApprovalComplete) {
          console.log('Processing manager approval');
          
          if (isManager || req.user.role === 'ADMIN') {
            // Create manager approval action
            const managerAction = await tx.approvalAction.create({
              data: {
                expenseId,
                approverId: req.user.id,
                status,
                comments: comments || null,
                stepIndex: -1 // Manager approval is step -1
              }
            });

            console.log('Created manager approval action:', managerAction.id);

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

            console.log('Manager approval complete, initializing workflow');

            // Create pending approval actions for the workflow
            if (approvalRules.length > 0) {
              await this.initializeApprovalWorkflow(expenseId, approvalRules, tx);
            } else {
              // No approval rules, auto-approve
              console.log('No approval rules found, auto-approving');
              await tx.expense.update({
                where: { id: expenseId },
                data: { status: 'APPROVED' }
              });
              return {
                approved: true,
                message: 'Expense auto-approved (no approval rules configured)'
              };
            }

            return {
              approved: false,
              managerApproved: true,
              message: 'Manager approval complete. Expense moved to approval workflow.'
            };
          } else {
            return { error: 'Manager must approve this expense first', statusCode: 403 };
          }
        }

        // Handle Workflow Approvals
        console.log('Processing workflow approval');
        
        const currentAction = expense.approvalActions.find(
          action => action.approverId === req.user.id && action.status === 'PENDING'
        );

        console.log('Current action:', currentAction?.id);

        if (!currentAction && req.user.role !== 'ADMIN') {
          return { error: 'No pending approval action found for you', statusCode: 403 };
        }

        // Update or create approval action
        if (currentAction) {
          await tx.approvalAction.update({
            where: { id: currentAction.id },
            data: {
              status,
              comments: comments || null
            }
          });
          console.log('Updated approval action:', currentAction.id);
        } else if (req.user.role === 'ADMIN') {
          // Admin can approve even without a specific action
          const adminAction = await tx.approvalAction.create({
            data: {
              expenseId,
              approverId: req.user.id,
              status,
              comments: comments || null,
              stepIndex: expense.currentStepIndex || 0
            }
          });
          console.log('Created admin approval action:', adminAction.id);
        }

        if (status === 'REJECTED') {
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'REJECTED' }
          });
          return { approved: false, rejected: true, message: 'Expense rejected' };
        }

        // If no approval rules, auto-approve
        if (approvalRules.length === 0) {
          console.log('No approval rules, auto-approving');
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'APPROVED' }
          });
          return { approved: true, message: 'Expense approved (no approval rules configured)' };
        }

        // Check if expense should be approved based on rules
        const shouldApprove = await this.evaluateApprovalRules(
          expenseId,
          approvalRules,
          tx
        );

        console.log('Evaluation result:', shouldApprove);

        if (shouldApprove.approved) {
          await tx.expense.update({
            where: { id: expenseId },
            data: { status: 'APPROVED' }
          });
          return { approved: true, message: shouldApprove.reason };
        }

        // Move to next step if sequential
        const sequentialRule = approvalRules.find(r => r.type === 'SEQUENTIAL');
        if (sequentialRule && sequentialRule.steps.length > 0) {
          const currentStepIndex = expense.currentStepIndex || 0;
          const nextStep = sequentialRule.steps[currentStepIndex + 1];
          
          console.log('Sequential rule:', { currentStepIndex, hasNextStep: !!nextStep });
          
          if (nextStep) {
            // Check if action already exists for next step
            const existingNextAction = await tx.approvalAction.findFirst({
              where: {
                expenseId,
                approverId: nextStep.approverId,
                stepIndex: currentStepIndex + 1
              }
            });

            if (!existingNextAction) {
              // Create pending action for next approver
              await tx.approvalAction.create({
                data: {
                  expenseId,
                  approverId: nextStep.approverId,
                  status: 'PENDING',
                  stepIndex: currentStepIndex + 1
                }
              });
            }

            await tx.expense.update({
              where: { id: expenseId },
              data: {
                currentStepIndex: currentStepIndex + 1
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

      console.log('Transaction result:', result);

      // Handle errors from transaction
      if (result.error) {
        return res.status(result.statusCode || 400).json({ error: result.error });
      }

      res.json(result);
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

  async initializeApprovalWorkflow(expenseId, rules, tx) {
    try {
      console.log('Initializing approval workflow for expense:', expenseId);
      
      // Create pending approval actions based on rules
      const allApprovers = new Set();

      for (const rule of rules) {
        if (rule.type === 'SEQUENTIAL') {
          // For sequential, only add first approver
          if (rule.steps && rule.steps.length > 0) {
            allApprovers.add(rule.steps[0].approverId);
            console.log('Added sequential first approver:', rule.steps[0].approverId);
          }
        } else if (rule.type === 'PERCENTAGE' || rule.type === 'HYBRID') {
          // Add all approvers in steps
          if (rule.steps) {
            rule.steps.forEach(step => {
              allApprovers.add(step.approverId);
              console.log('Added approver:', step.approverId);
            });
          }
        } else if (rule.type === 'SPECIFIC_APPROVER' && rule.specificApproverId) {
          allApprovers.add(rule.specificApproverId);
          console.log('Added specific approver:', rule.specificApproverId);
        }
      }

      console.log('Total unique approvers:', allApprovers.size);

      // Check for existing actions to avoid duplicates
      const existingActions = await tx.approvalAction.findMany({
        where: {
          expenseId,
          stepIndex: 0
        },
        select: { approverId: true }
      });

      const existingApproverIds = new Set(existingActions.map(a => a.approverId));
      console.log('Existing approver actions:', existingApproverIds.size);

      // Create pending actions only for new approvers
      const actions = Array.from(allApprovers)
        .filter(approverId => !existingApproverIds.has(approverId))
        .map(approverId => ({
          expenseId,
          approverId,
          status: 'PENDING',
          stepIndex: 0
        }));

      console.log('Creating approval actions:', actions.length);

      if (actions.length > 0) {
        await tx.approvalAction.createMany({ data: actions });
        console.log('Approval actions created successfully');
      } else {
        console.log('No new approval actions needed');
      }
    } catch (error) {
      console.error('Initialize Approval Workflow Error:', {
        message: error.message,
        stack: error.stack,
        expenseId
      });
      throw error;
    }
  }

  async evaluateApprovalRules(expenseId, rules, tx) {
    try {
      console.log('Evaluating approval rules for expense:', expenseId);
      
      const approvedActions = await tx.approvalAction.findMany({
        where: {
          expenseId,
          status: 'APPROVED',
          stepIndex: { gte: 0 } // Only count workflow approvals, not manager (-1)
        },
        include: {
          approver: true
        }
      });

      console.log('Approved actions count:', approvedActions.length);

      const approverIds = approvedActions.map(a => a.approverId);

      // Check each rule (sorted by priority)
      for (const rule of rules) {
        console.log('Checking rule:', rule.name, rule.type);
        
        // SPECIFIC_APPROVER: If specific person approved, auto-approve
        if (rule.type === 'SPECIFIC_APPROVER') {
          if (rule.specificApproverId && approverIds.includes(rule.specificApproverId)) {
            console.log('Rule satisfied: SPECIFIC_APPROVER');
            return {
              approved: true,
              reason: `Auto-approved by specific approver: ${rule.specificApprover?.name || 'Unknown'}`
            };
          }
        }

        // PERCENTAGE: Check if required percentage met
        if (rule.type === 'PERCENTAGE') {
          const totalApprovers = rule.steps?.length || 0;
          const approvedCount = (rule.steps || []).filter(step =>
            approverIds.includes(step.approverId)
          ).length;
          const percentage = totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0;

          console.log('Percentage check:', { approvedCount, totalApprovers, percentage, required: rule.percentageRequired });

          if (percentage >= (rule.percentageRequired || 0)) {
            console.log('Rule satisfied: PERCENTAGE');
            return {
              approved: true,
              reason: `Approved by ${percentage.toFixed(0)}% of approvers (required: ${rule.percentageRequired}%)`
            };
          }
        }

        // SEQUENTIAL: Check if all steps completed
        if (rule.type === 'SEQUENTIAL') {
          const allStepsApproved = (rule.steps || []).every(step =>
            approverIds.includes(step.approverId)
          );

          console.log('Sequential check:', { allStepsApproved, totalSteps: rule.steps?.length });

          if (allStepsApproved && rule.steps && rule.steps.length > 0) {
            console.log('Rule satisfied: SEQUENTIAL');
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
            console.log('Rule satisfied: HYBRID (specific approver)');
            return {
              approved: true,
              reason: `Auto-approved by specific approver: ${rule.specificApprover?.name || 'Unknown'}`
            };
          }

          // Check percentage
          const totalApprovers = rule.steps?.length || 0;
          const approvedCount = (rule.steps || []).filter(step =>
            approverIds.includes(step.approverId)
          ).length;
          const percentage = totalApprovers > 0 ? (approvedCount / totalApprovers) * 100 : 0;

          console.log('Hybrid percentage check:', { approvedCount, totalApprovers, percentage, required: rule.percentageRequired });

          if (percentage >= (rule.percentageRequired || 0)) {
            console.log('Rule satisfied: HYBRID (percentage)');
            return {
              approved: true,
              reason: `Approved by ${percentage.toFixed(0)}% of approvers (required: ${rule.percentageRequired}%)`
            };
          }
        }
      }

      console.log('No rules satisfied yet');
      return { approved: false };
    } catch (error) {
      console.error('Evaluate Approval Rules Error:', {
        message: error.message,
        stack: error.stack,
        expenseId
      });
      throw error;
    }
  }
}

export default new ApprovalController();
