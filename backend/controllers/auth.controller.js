import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import currencyService from '../utils/currencyService.js';

class AuthController {
  async signup(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password, country } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Get country currencies
      const countries = await currencyService.getAllCountries();
      const selectedCountry = countries.find(c => 
        c.name.toLowerCase() === country.toLowerCase()
      );

      if (!selectedCountry) {
        return res.status(400).json({ error: 'Invalid country' });
      }

      const currency = Object.keys(selectedCountry.currencies)[0];

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create company and admin user in transaction
      const result = await prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: `${name}'s Company`,
            country,
            currency
          }
        });

        const user = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'ADMIN',
            companyId: company.id
          },
          include: {
            company: true
          }
        });

        // Create default categories
        await tx.category.createMany({
          data: [
            { name: 'Travel', companyId: company.id },
            { name: 'Food', companyId: company.id },
            { name: 'Office Supplies', companyId: company.id },
            { name: 'Entertainment', companyId: company.id },
            { name: 'Other', companyId: company.id },
          ]
        });

        return user;
      });

      const token = jwt.sign(
        { userId: result.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.status(201).json({
        message: 'User and company created successfully',
        token,
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          role: result.role,
          company: result.company
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { company: true, manager: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          manager: user.manager
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      res.json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          company: req.user.company,
          manager: req.user.manager
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCountries(req, res, next) {
    try {
      const countries = await currencyService.getAllCountries();
      res.json({ countries });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
