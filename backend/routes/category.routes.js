import express from 'express';
import { body } from 'express-validator';
import CategoryController from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorize('ADMIN'), [
  body('name').trim().notEmpty(),
], CategoryController.createCategory);

router.get('/', CategoryController.getCategories);

router.put('/:id', authorize('ADMIN'), CategoryController.updateCategory);

router.delete('/:id', authorize('ADMIN'), CategoryController.deleteCategory);

export default router;
