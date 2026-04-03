import express from "express";
import { protect, authorize } from "../middleware/authMiddleware.js";
import {
  getDailyReport,
  getWeeklyReport,
  getMonthlyDiagnoses,
  getRecentPatients,
  getDateRangeReport,
} from "../controllers/reportsController.js";

const router = express.Router();

// All report routes require authentication
router.use(protect);

// Get daily report (for dashboard)
router.get("/daily", authorize("principal-doctor"), getDailyReport);

// Get weekly chart data
router.get("/weekly", authorize("principal-doctor"), getWeeklyReport);

// Get monthly diagnoses
router.get("/diagnoses/monthly", authorize("principal-doctor"), getMonthlyDiagnoses);

// Get filtered report by date range
//router.get("/filtered", authorize("principal-doctor"), getFilteredReport);

// Get recent patients
router.get("/recent-patients", authorize("principal-doctor"), getRecentPatients);

// Get date range report (immediate updates)
router.get("/date-range", authorize("principal-doctor"), getDateRangeReport);

export default router;