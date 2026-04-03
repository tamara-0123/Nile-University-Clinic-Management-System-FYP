import express from "express";
import {
  getDailyAppointments,
  getPatientRecord,
  createConsultation,
  updateConsultation,
  createPrescription,
  updatePrescription,
  completeAppointment,
  addAvailability,
  getAvailability,
  removeAvailability,
  getPatientVitals,
  updatePatientVitals,
  getAdmissionStatus,
  dischargePatient,
  admitPatient,
  createSimplifiedPrescription,
  getPendingPharmacistPrescriptions,
  getAllAppointments,
  getRecordsStats,
  getPatientRecords,
  getCompletedAppointments
} from "../controllers/doctorController.js";


import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, authorize("doctor", "principal-doctor"));

router.get("/appointments", getDailyAppointments);
router.get("/patient/:patientId", getPatientRecord);
router.post("/consultation/:appointmentId", createConsultation);
router.put("/consultation/:id", updateConsultation);
router.post("/prescription/:consultationId", createPrescription);
router.put("/prescription/:id", updatePrescription);
router.put("/complete/:appointmentId", completeAppointment);
router.get("/all-appointments", getAllAppointments);


router.get("/availability", getAvailability);
router.post("/availability", addAvailability);
router.delete("/availability/:id", removeAvailability);

router.get("/vitals", getPatientVitals);
router.post("/vitals/:vitalsId", updatePatientVitals);


router.get('/admission/status', getAdmissionStatus);
router.post('/admit', admitPatient);
router.put('/discharge/:admissionId', dischargePatient);

router.post('/prescription/simplified/:consultationId', createSimplifiedPrescription);
router.get('/prescriptions/pending', getPendingPharmacistPrescriptions);


router.get('/records-stats', getRecordsStats);
router.get('/patient-records/:patientId', getPatientRecords);
router.get('/completed-appointments', getCompletedAppointments);
export default router;