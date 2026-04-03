import express from "express";
const router = express.Router();
import * as vitalsController from "../controllers/vitalController.js";

// Save vitals (doctor submits new vitals)
router.post("/vitals", vitalsController.saveVitals);

// Get latest vitals for an appointment and patient
router.post("/vitals/latest", vitalsController.getLatestVitals);

export default router;
