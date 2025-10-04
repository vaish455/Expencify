import express from 'express';
import { body } from 'express-validator';
import ApprovalController from '../controllers/approval.controller.js';
import { authenticate, authorize, isAdminOrManager } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/rules', authorize('ADMIN'), [
  body('name').trim().notEmpty(),
  body('type').isIn(['SEQUENTIAL', 'PERCENTAGE', 'SPECIFIC_APPROVER', 'HYBRID']),
], ApprovalController.createApprovalRule);

router.get('/rules', authorize('ADMIN'), ApprovalController.getApprovalRules);

router.put('/rules/:id', authorize('ADMIN'), ApprovalController.updateApprovalRule);

router.delete('/rules/:id', authorize('ADMIN'), ApprovalController.deleteApprovalRule);

router.get('/pending', isAdminOrManager, ApprovalController.getPendingApprovals);

router.post('/process/:expenseId', isAdminOrManager, [
  body('status').isIn(['APPROVED', 'REJECTED']),
], ApprovalController.processApproval);

export default router;
