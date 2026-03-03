import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import emailService from '../utils/emailService.js';

class UserController {
  async createUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, role, managerId, isManagerApprover } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      // Generate random password
      const generatedPassword = emailService.generateRandomPassword();
      const hashedPassword = await bcrypt.hash(generatedPassword, 10);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          companyId: req.user.companyId,
          managerId: managerId || null,
          isManagerApprover: isManagerApprover || false
        },
        include: {
          manager: true,
          company: true
        }
      });

      // Send email with credentials (async, don't wait)
      emailService.sendUserCreatedEmail(
        user,
        generatedPassword,
        user.company,
        req.user
      ).catch(err => console.error('Failed to send user created email:', err));

      res.status(201).json({
        message: 'User created successfully. Credentials sent via email.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          manager: user.manager
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const { role } = req.query;
      
      const where = { companyId: req.user.companyId };
      if (role) where.role = role;

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isManagerApprover: true,
          createdAt: true,
          manager: {
            select: { 
              id: true, 
              name: true, 
              email: true 
            }
          }
        }
      });

      res.json({ users });
    } catch (error) {
      console.error('Get all users error:', error);
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findFirst({
        where: {
          id,
          companyId: req.user.companyId
        },
        include: {
          manager: true,
          employees: true,
          company: true
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name, role, managerId, isManagerApprover } = req.body;

      const user = await prisma.user.findFirst({
        where: { id, companyId: req.user.companyId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name,
          role,
          managerId,
          isManagerApprover
        },
        include: { manager: true }
      });

      res.json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findFirst({
        where: { id, companyId: req.user.companyId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user has employees reporting to them
      const employeeCount = await prisma.user.count({
        where: { managerId: id }
      });

      if (employeeCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete user. ${employeeCount} employee(s) are reporting to this manager. Please reassign them first.` 
        });
      }

      // Check if user has pending expenses
      const pendingExpensesCount = await prisma.expense.count({
        where: { 
          userId: id,
          status: { in: ['PENDING', 'IN_PROGRESS'] }
        }
      });

      if (pendingExpensesCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete user. They have ${pendingExpensesCount} pending expense(s). Please resolve them first.` 
        });
      }

      // Use transaction to handle related records in correct order
      await prisma.$transaction(async (tx) => {
        // 1. Delete approval actions first (has FK to user)
        await tx.approvalAction.deleteMany({
          where: { approverId: id }
        });

        // 2. Delete approval steps (has FK to user and approval rule)
        await tx.approvalStep.deleteMany({
          where: { approverId: id }
        });

        // 3. Update approval rules to remove this user as specific approver
        await tx.approvalRule.updateMany({
          where: { specificApproverId: id },
          data: { specificApproverId: null }
        });

        // 4. Delete user's expenses (will cascade delete OCR data and approval actions)
        await tx.expense.deleteMany({
          where: { userId: id }
        });

        // 5. Finally delete the user
        await tx.user.delete({ where: { id } });
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      if (error.code === 'P2003') {
        return res.status(400).json({ 
          error: 'Cannot delete user due to existing related records. Please contact support.' 
        });
      }
      if (error.code === 'P2014') {
        return res.status(400).json({ 
          error: 'Cannot delete user due to database constraints. Please ensure all related records are removed first.' 
        });
      }
      next(error);
    }
  }

  async assignManager(req, res, next) {
    try {
      const { id } = req.params;
      const { managerId } = req.body;

      const user = await prisma.user.update({
        where: { id },
        data: { managerId },
        include: { manager: true }
      });

      res.json({
        message: 'Manager assigned successfully',
        user
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
