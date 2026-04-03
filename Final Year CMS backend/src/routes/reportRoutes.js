import express from 'express';
import { dailyAttendanceReport, monthlyVisitSummary, doctorWorkloadReport, nurseActivityReport, getAdmissionDischargeReport } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
const router = express.Router();

router.get('/daily-attendance', protect, authorize('admin'), dailyAttendanceReport);
router.get('/monthly-visit-summary', protect, authorize('admin'), monthlyVisitSummary);
router.get('/doctor-workload', protect, authorize('admin'), doctorWorkloadReport);
router.get('/nurse-activity', protect, authorize('admin'), nurseActivityReport);
router.get('/admission-discharge', protect, authorize('admin'), getAdmissionDischargeReport);

export default router;