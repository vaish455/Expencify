import express from 'express';
import { body } from 'express-validator';
import UserController from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), [
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['EMPLOYEE', 'MANAGER']),
], UserController.createUser);

router.get('/', UserController.getAllUsers);

router.get('/:id', UserController.getUserById);

router.put('/:id', authorize('ADMIN'), UserController.updateUser);

router.delete('/:id', authorize('ADMIN'), UserController.deleteUser);

router.put('/:id/assign-manager', authorize('ADMIN'), UserController.assignManager);

export default router;
