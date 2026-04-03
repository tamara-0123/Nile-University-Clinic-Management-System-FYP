import express from "express";
import {
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  getAppointmentHistory,
  getMedicalHistory,
  getPrescriptions,
  getNotifications,
  updateMedicalProfile,
  submitFeedback,
} from "../controllers/patientController.js";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { getUserProfile } from "../controllers/patientController.js";

const router = express.Router();

router.use(protect, authorize("student" || "staff"));

router.get("/profile", getUserProfile);
router.post("/appointments", bookAppointment);
router.put("/appointments/:id/cancel", cancelAppointment);
router.put("/appointments/:id/reschedule", rescheduleAppointment);
router.get("/appointments/history", getAppointmentHistory);
router.get("/medical-history", getMedicalHistory);
router.put('/update-medical-profile', updateMedicalProfile);
router.get("/prescriptions", getPrescriptions);
router.get("/notifications", getNotifications);
router.post("/feedback", submitFeedback);

export default router; 