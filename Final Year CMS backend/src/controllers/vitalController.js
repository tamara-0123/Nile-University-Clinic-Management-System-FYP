import Vital from "../models/Vitals.js";

// Create or update vitals (doctor enters vitals)
export const saveVitals = async (req, res, next) => {
  try {
    const { appointmentId, patientId, bp, temperature, pulse, weight } = req.body;

    // Save new vitals entry
    const vitals = await Vital.create({
      appointmentId,
      patientId,
      bp,
      temperature,
      pulse,
      weight
    });

    res.json({ success: true, vitals });
  } catch (err) {
    next(err);
  }
};

// Get latest vitals for an appointment or patient
export const getLatestVitals = async (req, res, next) => {
  try {
    const { appointmentId, patientId } = req.body;

    // Find the newest vitals record
    const vitals = await Vital.findOne({
      appointmentId,
      patientId
    })
      .sort({ createdAt: -1 });

    if (!vitals) {
      return res.json({ success: true, vitals: null });
    }

    res.json({ success: true, vitals });
  } catch (err) {
    next(err);
  }
};
