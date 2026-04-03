import express from 'express';
import {
  admitPatient,
  dischargePatient,
  getAdmissionStatus,
  getAdmissions,
  getAdmissionById,
  updateAdmission
} from '../controllers/admissionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected and require authentication
router.use(protect);

// Routes accessible by doctors and nurses
router.route('/status')
  .get(getAdmissionStatus);

router.route('/')
  .get(authorize('doctor', 'nurse', 'admin'), getAdmissions)
  .post(authorize('doctor', 'nurse'), admitPatient);

router.route('/:admissionId')
  .get(authorize('doctor', 'nurse', 'admin'), getAdmissionById)
  .put(authorize('doctor', 'nurse'), updateAdmission);

router.route('/discharge/:admissionId')
  .put(authorize('doctor', 'nurse'), dischargePatient);

export default router;