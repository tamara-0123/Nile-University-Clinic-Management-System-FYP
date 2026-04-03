import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getPendingPrescriptions,
  getPrescriptionVitals,
  completePrescription,
  getPharmacistStats,
  getPrescriptionById,
  getPrescriptionHistory,
  updateCompletedPrescription
} from '../controllers/pharmacistController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('pharmacist', 'principal-doctor'));

router.get('/stats', getPharmacistStats);

// Prescription management
router.get('/prescriptions/pending', getPendingPrescriptions);
router.get('/prescription/:prescriptionId', getPrescriptionById);
router.get('/prescription/:prescriptionId/vitals', getPrescriptionVitals);
router.put('/prescription/:prescriptionId/complete', completePrescription);
router.get('/prescriptions/history', getPrescriptionHistory);
router.put('/prescription/:prescriptionId/update', updateCompletedPrescription);

export default router;