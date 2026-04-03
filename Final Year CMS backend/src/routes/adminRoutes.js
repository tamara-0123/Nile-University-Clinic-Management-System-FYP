import express from "express";
import { getAllStaff, createUser, toggleUserStatus, updateUser, broadcastNotification, getPatientRecords,  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAvailableDoctors,
  getAppointmentById, } from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Principal Doctor (Admin) access only
router.use(protect);
router.use(authorize("principal-doctor"));

router.get('/appointments', getAppointments);
router.get('/appointments/:id', getAppointmentById);
router.post('/appointments', createAppointment);
router.put('/appointments/:id', updateAppointment);
router.delete('/appointments/:id', deleteAppointment);
router.get('/doctors/available', getAvailableDoctors);

router.get("/users", getAllStaff);
router.post("/users", createUser);
router.put("/users/:id/status", toggleUserStatus);
router.put("/users/:id", updateUser);
router.post("/notifications", broadcastNotification);
router.get("/patient-records", getPatientRecords);  

export default router;