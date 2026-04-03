import Admission from "../models/Admission.js";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";

/**
 * Admit a patient
 * POST /api/doctor/admit
 * Body: { patientId, appointmentId, reason }
 */
export const admitPatient = async (req, res) => {
  try {
    const { patientId, appointmentId, reason } = req.body;
    const doctorId = req.user._id; // Assuming user is attached by auth middleware

    // Validate required fields
    if (!patientId || !appointmentId || !reason) {
      return res.status(400).json({
        success: false,
        message: "Patient ID, appointment ID, and reason are required"
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }

    // Check if there's already an active admission for this patient
    const existingAdmission = await Admission.findOne({
      patient: patientId,
      isActive: true
    });

    if (existingAdmission) {
      return res.status(400).json({
        success: false,
        message: "Patient already has an active admission"
      });
    }

    // Create new admission record
    const admission = new Admission({
      patient: patientId,
      admittedBy: doctorId, // Doctor admitting the patient
      reason: reason,
      admissionDate: new Date(),
      isActive: true
    });

    await admission.save();

    // Update the appointment status to 'admitted'
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: 'admitted'
    });

    // Populate the admission with patient and doctor details for response
    await admission.populate([
      { path: 'patient', populate: { path: 'user' } },
      { path: 'admittedBy', select: 'name email' }
    ]);

    return res.status(201).json({
      success: true,
      message: "Patient admitted successfully",
      admission
    });

  } catch (error) {
    console.error("Error in admitPatient:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to admit patient",
      error: error.message
    });
  }
};

/**
 * Discharge a patient
 * PUT /api/doctor/discharge/:admissionId
 */
export const dischargePatient = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const doctorId = req.user._id;

    // Find active admission
    const admission = await Admission.findOne({
      _id: admissionId,
      isActive: true
    });

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Active admission not found"
      });
    }

    // Update admission record
    admission.dischargeDate = new Date();
    admission.dischargedBy = doctorId;
    admission.isActive = false;
    
    await admission.save();

    // Find and update the associated appointment to 'completed'
    // You might need to link admission to appointment or find by patient
    await Appointment.findOneAndUpdate(
      { 
        patient: admission.patient,
        status: 'admitted'
      },
      { 
        status: 'completed',
        dischargeDate: new Date()
      },
      { sort: { date: -1 } } // Get the most recent appointment
    );

    await admission.populate([
      { path: 'patient', populate: { path: 'user' } },
      { path: 'admittedBy', select: 'name email' },
      { path: 'dischargedBy', select: 'name email' }
    ]);

    return res.status(200).json({
      success: true,
      message: "Patient discharged successfully",
      admission
    });

  } catch (error) {
    console.error("Error in dischargePatient:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to discharge patient",
      error: error.message
    });
  }
};

/**
 * Get admission status for a patient/appointment
 * GET /api/doctor/admission/status
 * Query params: ?appointmentId=&patientId=
 */
export const getAdmissionStatus = async (req, res) => {
  try {
    const { appointmentId, patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required"
      });
    }

    // Find active admission for this patient
    const admission = await Admission.findOne({
      patient: patientId,
      isActive: true
    }).populate([
      { path: 'patient', populate: { path: 'user' } },
      { path: 'admittedBy', select: 'name email' }
    ]);

    if (!admission) {
      return res.status(200).json({
        success: true,
        admission: null,
        message: "No active admission found"
      });
    }

    return res.status(200).json({
      success: true,
      admission
    });

  } catch (error) {
    console.error("Error in getAdmissionStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get admission status",
      error: error.message
    });
  }
};

/**
 * Get all admissions (with filters)
 * GET /api/doctor/admissions
 * Query params: ?status=active|discharged&patientId=&date=
 */
export const getAdmissions = async (req, res) => {
  try {
    const { status, patientId, startDate, endDate } = req.query;
    let query = {};

    // Filter by status
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'discharged') {
      query.isActive = false;
    }

    // Filter by patient
    if (patientId) {
      query.patient = patientId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.admissionDate = {};
      if (startDate) {
        query.admissionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.admissionDate.$lte = new Date(endDate);
      }
    }

    const admissions = await Admission.find(query)
      .populate([
        { path: 'patient', populate: { path: 'user' } },
        { path: 'admittedBy', select: 'name email' },
        { path: 'dischargedBy', select: 'name email' }
      ])
      .sort({ admissionDate: -1 });

    return res.status(200).json({
      success: true,
      count: admissions.length,
      admissions
    });

  } catch (error) {
    console.error("Error in getAdmissions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get admissions",
      error: error.message
    });
  }
};

/**
 * Get a single admission by ID
 * GET /api/doctor/admission/:admissionId
 */
export const getAdmissionById = async (req, res) => {
  try {
    const { admissionId } = req.params;

    const admission = await Admission.findById(admissionId)
      .populate([
        { path: 'patient', populate: { path: 'user' } },
        { path: 'admittedBy', select: 'name email' },
        { path: 'dischargedBy', select: 'name email' }
      ]);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Admission not found"
      });
    }

    return res.status(200).json({
      success: true,
      admission
    });

  } catch (error) {
    console.error("Error in getAdmissionById:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get admission",
      error: error.message
    });
  }
};

/**
 * Update admission notes/reason
 * PUT /api/doctor/admission/:admissionId
 */
export const updateAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const { reason } = req.body;

    const admission = await Admission.findById(admissionId);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: "Admission not found"
      });
    }

    // Only allow updates if admission is still active
    if (!admission.isActive) {
      return res.status(400).json({
        success: false,
        message: "Cannot update discharged admission"
      });
    }

    if (reason) {
      admission.reason = reason;
    }

    await admission.save();
    await admission.populate([
      { path: 'patient', populate: { path: 'user' } },
      { path: 'admittedBy', select: 'name email' }
    ]);

    return res.status(200).json({
      success: true,
      message: "Admission updated successfully",
      admission
    });

  } catch (error) {
    console.error("Error in updateAdmission:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update admission",
      error: error.message
    });
  }
};