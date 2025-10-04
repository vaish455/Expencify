import express from 'express';
import { body } from 'express-validator';
import AuthController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('country').notEmpty().withMessage('Country is required'),
], AuthController.signup);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], AuthController.login);

router.get('/me', authenticate, AuthController.getProfile);

router.get('/countries', AuthController.getCountries);

export default router;
