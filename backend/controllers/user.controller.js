import bcrypt from 'bcryptjs';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';

class UserController {
  async createUser(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, role, managerId, isManagerApprover } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

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

      res.status(201).json({
        message: 'User created successfully',
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
        include: {
          manager: {
            select: { id: true, name: true, email: true }
          },
          employees: {
            select: { id: true, name: true, email: true }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isManagerApprover: true,
          manager: true,
          employees: true,
          createdAt: true
        }
      });

      res.json({ users });
    } catch (error) {
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

      await prisma.user.delete({ where: { id } });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
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
