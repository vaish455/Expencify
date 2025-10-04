import express from 'express';
import CompanyController from '../controllers/company.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', CompanyController.getCompany);

router.put('/', authorize('ADMIN'), CompanyController.updateCompany);

router.get('/statistics', CompanyController.getStatistics);

export default router;
