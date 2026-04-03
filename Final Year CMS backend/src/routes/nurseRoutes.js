import express from "express";
import {
  getDailyQueue,
  recordVitals,
  updatePatientStatus,
  viewBasicPatientRecord,
  referPatient,
  generateDailyReport,
  admitPatient,
  dischargePatient,
  getDoctors,
  nurseRescheduleAppointment,
  nurseCancelAppointment,
  getRecentVitals,
  getDashboardVitals
} from "../controllers/nurseController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();


router.use(protect, authorize("nurse"));

router.get("/queue", getDailyQueue);
router.post("/vitals/:appointmentId", recordVitals);
router.get('/vitals/recent', getRecentVitals);
router.get('/vitals/dashboard', getDashboardVitals);
router.put("/status/:appointmentId", updatePatientStatus);
router.get("/patient/:patientId", viewBasicPatientRecord);
router.put('/reschedule/:id', nurseRescheduleAppointment);
router.put('/cancel/:id', nurseCancelAppointment);
router.post("/refer/:appointmentId", referPatient);
router.get("/report/daily", generateDailyReport);
router.post("/admit", admitPatient);
router.post("/discharge/:admissionId", dischargePatient);
router.get("/doctors", getDoctors);


export default router;