import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Consultation from "../models/Consultation.js";
import Prescription from "../models/Prescription.js";
import Notification from "../models/Notification.js";
import Availability from "../models/Availability.js";
import Vitals from "../models/Vitals.js";
import Admission from "../models/Admission.js";

export const getDailyAppointments = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: req.user._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ["waiting", "in-consultation", "completed","referral", "admitted"] },
    })
      .populate({
        path: "patient",
        populate: {
          path: "user",
          select: "name studentID staffID age gender department" // Include age and gender
        }
      })
      .sort({ date: 1 });

    // Format appointments to ensure age and gender are accessible
    const formattedAppointments = appointments.map(appt => {
      const patientData = appt.patient || {};
      const userData = patientData.user || {};
      
      return {
        _id: appt._id,
        date: appt.date,
        reason: appt.reason,
        condition: appt.condition,
        urgency: appt.urgency,
        status: appt.status,
        patient: {
          _id: patientData._id,
          user: {
            name: userData.name || 'Unknown',
            studentID: userData.studentID || null,
            staffID: userData.staffID || null,
            age: userData.age || null,
            gender: userData.gender || null,
            department: userData.department || null
          }
        }
      };
    });

    res.json({ success: true, appointments: formattedAppointments });
  } catch (error) {
    next(error);
  }
};

export const getPatientRecord = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId)
      .populate("user", "name studentID staffID age gender department");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const appointments = await Appointment.find({ patient: patient._id });
    const appointmentIds = appointments.map(app => app._id);

    // Populate consultations with appointment and doctor details
    const consultations = await Consultation.find({
      appointment: { $in: appointmentIds }
    })
    .populate({
      path: "appointment",
      populate: {
        path: "doctor",
        select: "name"
      }
    })
    .sort({ createdAt: -1 });

    const consultationIds = consultations.map(con => con._id);

    const prescriptions = await Prescription.find({
      consultation: { $in: consultationIds }
    });

    res.json({
      success: true,
      patient,
      history: {
        consultations,
        prescriptions
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createConsultation = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment || appointment.doctor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to consult for this appointment" });
    }

    const consultation = await Consultation.create({
      appointment: appointment._id,
      diagnosis: req.body.diagnosis,
      notes: req.body.notes,
    });

    appointment.status = "completed";
    await appointment.save();

    res.status(201).json({
      success: true,
      message: "Consultation saved and appointment closed",
      consultation
    });
  } catch (error) {
    next(error);
  }
};

export const updateConsultation = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Allow updates only within 24 hours of creation
    const now = new Date();
    const createdTime = new Date(consultation.createdAt);
    const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      return res.status(400).json({ message: "Consultation is locked after 24 hours" });
    }

    consultation.notes = req.body.notes || consultation.notes;
    consultation.diagnosis = req.body.diagnosis || consultation.diagnosis;
    await consultation.save();

    res.json({ success: true, consultation });
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (req, res, next) => {
  try {
    // Get the consultation with patient info
    const consultation = await Consultation.findById(req.params.consultationId).populate({
      path: "appointment",
      populate: { path: "patient" }, // ensures consultation.appointment.patient exists
    });

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    // Create the prescription, including the required patient field
    const prescription = await Prescription.create({
      consultation: consultation._id,
      patient: consultation.appointment.patient._id, // <-- REQUIRED NOW
      medications: req.body.medications,
      createdBy: req.user._id,
      version: 1,
    });

    // Send notification to the patient
    await Notification.create({
      user: consultation.appointment.patient.user,
      title: "Prescription Available",
      message: "A new prescription has been added to your medical record.",
      type: "prescription",
    });

    res.status(201).json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};


export const updatePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    prescription.medications = req.body.medications;
    prescription.version += 1;
    await prescription.save();

    res.json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};

export const addAvailability = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime, date } = req.body;
    const availability = await Availability.create({
      doctor: req.user._id,
      dayOfWeek,
      startTime,
      endTime,
      date: date ? new Date(date) : undefined
    });

    res.status(201).json({ success: true, availability });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const availability = await Availability.find({ doctor: req.user._id });
    res.json({ success: true, availability });
  } catch (error) {
    next(error);
  }
};

export const removeAvailability = async (req, res, next) => {
  try {
    await Availability.findOneAndDelete({ _id: req.params.id, doctor: req.user._id });
    res.json({ success: true, message: "Availability removed" });
  } catch (error) {
    next(error);
  }
};

export const completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate("patient");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if patient is admitted before completing
    const activeAdmission = await Admission.findOne({
      patient: appointment.patient._id,
      isActive: true
    });

    if (activeAdmission) {
      return res.status(400).json({ 
        message: "Cannot complete appointment while patient is admitted. Please discharge first." 
      });
    }

    appointment.status = "completed";
    appointment.completionTime = Date.now();
    await appointment.save();

    await Notification.create({
      user: appointment.patient.user,
      title: "Appointment Completed",
      message: "Your clinic visit has been completed.",
      type: "status",
    });

    res.json({
      success: true,
      message: "Appointment completed and records locked",
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientVitals = async (req, res, next) => {
  try {
    const { patientId, appointmentId } = req.query; // doctor can filter by patient or appointment

    if (!patientId) {
      return res.status(400).json({ success: false, message: "patientId is required" });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId).populate("user", "name email");
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Build query
    const query = { patient: patientId };
    if (appointmentId) query.appointment = appointmentId;

    // Fetch vitals, latest first
    const vitalsRecords = await Vitals.find(query)
      .populate("appointment", "date status reason")
      .populate("recordedBy", "name role") // who recorded
      .sort({ createdAt: -1 });

    if (!vitalsRecords.length) {
      return res.json({ success: true, vitals: [] });
    }

    // Optionally, only send the latest vitals
    const latestVitals = vitalsRecords[0];

    res.json({
      success: true,
      patient: {
        _id: patient._id,
        name: patient.user.name,
        studentID: patient.studentID,
        staffID: patient.staffID,
      },
      vitals: vitalsRecords, // send all or just [latestVitals] for only latest
      latest: latestVitals,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePatientVitals = async (req, res, next) => {
  try {
    const { vitalsId } = req.params;
    const { bp, temperature, pulse, weight } = req.body;

    if (!vitalsId) {
      return res.status(400).json({ success: false, message: "Vitals ID is required" });
    }

    // Find the vitals record
    const vitals = await Vitals.findById(vitalsId);
    if (!vitals) {
      return res.status(404).json({ success: false, message: "Vitals record not found" });
    }

    // Optional: ensure doctor has access to patient
    const patient = await Patient.findById(vitals.patient);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient not found" });
    }

    // Update only provided fields
    if (bp !== undefined) vitals.bp = bp;
    if (temperature !== undefined) vitals.temperature = temperature;
    if (pulse !== undefined) vitals.pulse = pulse;
    if (weight !== undefined) vitals.weight = weight;

    await vitals.save();

    res.json({
      success: true,
      message: "Vitals updated successfully",
      vitals,
    });
  } catch (err) {
    next(err);
  }
};


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


export const createSimplifiedPrescription = async (req, res, next) => {
  try {
    const consultation = await Consultation.findById(req.params.consultationId).populate({
      path: "appointment",
      populate: { 
        path: "patient",
        populate: { path: "user" }
      }
    });

    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    const { drugName } = req.body;

    if (!drugName) {
      return res.status(400).json({ message: "Drug name is required" });
    }

    // Create a simplified prescription with only drug name
    const prescription = await Prescription.create({
      consultation: consultation._id,
      patient: consultation.appointment.patient._id,
      medications: [{
        name: drugName,
        dosage: null,
        frequency: null,
        duration: null,
        instructions: null,
        isPendingPharmacist: true
      }],
      createdBy: req.user._id,
      version: 1,
      status: 'pending-pharmacist'
    });

    // Send notification to all pharmacists (using role field)
    try {
      await Notification.create({
        role: "pharmacist",
        title: "New Prescription Pending",
        message: `Prescription for ${consultation.appointment.patient.user.name} needs pharmacist review. Drug: ${drugName}`,
        type: "prescription",
        metadata: {
          prescriptionId: prescription._id,
          patientName: consultation.appointment.patient.user.name,
          patientId: consultation.appointment.patient.user.studentID || consultation.appointment.patient.user.staffID,
          drugName: drugName,
          doctorName: req.user.name
        }
      });
    } catch (notifError) {
      console.error("Failed to create notification:", notifError);
      // Don't fail the prescription creation if notification fails
    }

    res.status(201).json({ 
      success: true, 
      message: "Prescription sent to pharmacist for completion",
      prescription 
    });
  } catch (error) {
    next(error);
  }
};


export const getPendingPharmacistPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ 
      status: 'pending-pharmacist',
      createdBy: req.user._id
    })
    .populate({
      path: "consultation",
      populate: {
        path: "appointment",
        populate: { path: "patient", populate: { path: "user" } }
      }
    })
    .sort({ createdAt: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
};


export const getAllAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.user._id,
      status: { $in: ["scheduled", "waiting", "checked-in", "in-consultation", "completed", "admitted", "cancelled"] },
    })
      .populate({
        path: "patient",
        populate: {
          path: "user",
          select: "name studentID staffID age gender department" // Include age and gender
        }
      })
      .sort({ date: 1 });

    // Format appointments to ensure age and gender are accessible
    const formattedAppointments = appointments.map(appt => {
      const patientData = appt.patient || {};
      const userData = patientData.user || {};
      
      return {
        _id: appt._id,
        date: appt.date,
        reason: appt.reason,
        condition: appt.condition,
        urgency: appt.urgency,
        status: appt.status,
        patient: {
          _id: patientData._id,
          user: {
            name: userData.name || 'Unknown',
            studentID: userData.studentID || null,
            staffID: userData.staffID || null,
            age: userData.age || null,
            gender: userData.gender || null,
            department: userData.department || null
          }
        }
      };
    });

    res.json({ success: true, appointments: formattedAppointments });
  } catch (error) {
    console.error('Error in getAllAppointments:', error);
    next(error);
  }
};

export const getCompletedAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.user._id,
      status: 'completed'
    })
      .populate({
        path: "patient",
        populate: {
          path: "user",
          select: "name studentID staffID age gender department" // Make sure age and gender are selected
        }
      })
      .sort({ date: -1 }); // Most recent first

    // Get consultations and prescriptions for each appointment
    const appointmentsWithDetails = await Promise.all(appointments.map(async (appt) => {
      const consultation = await Consultation.findOne({ appointment: appt._id });
      let prescriptions = [];
      
      if (consultation) {
        prescriptions = await Prescription.find({ consultation: consultation._id });
      }
      
      // Ensure patient data is properly structured
      const patientData = appt.patient || {};
      const userData = patientData.user || {};
      
      return {
        _id: appt._id,
        date: appt.date,
        reason: appt.reason,
        condition: appt.condition,
        urgency: appt.urgency,
        patient: {
          _id: patientData._id,
          user: {
            name: userData.name || 'Unknown',
            studentID: userData.studentID || null,
            staffID: userData.staffID || null,
            age: userData.age || null,
            gender: userData.gender || null,
            department: userData.department || patientData.department || null
          }
        },
        consultation: consultation,
        prescriptions: prescriptions
      };
    }));

    res.json({ success: true, appointments: appointmentsWithDetails });
  } catch (error) {
    console.error('Error in getCompletedAppointments:', error);
    next(error);
  }
};


export const getPatientRecords = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId)
      .populate("user", "name studentID staffID age gender department"); // Make sure age and gender are selected

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const appointments = await Appointment.find({ 
      patient: patient._id,
      status: 'completed'
    })
      .populate({
        path: "patient",
        populate: {
          path: "user",
          select: "name studentID staffID age gender department"
        }
      })
      .sort({ date: -1 });

    const appointmentsWithDetails = await Promise.all(appointments.map(async (appt) => {
      const consultation = await Consultation.findOne({ appointment: appt._id });
      let prescriptions = [];
      
      if (consultation) {
        prescriptions = await Prescription.find({ consultation: consultation._id });
      }
      
      const patientData = appt.patient || {};
      const userData = patientData.user || {};
      
      return {
        _id: appt._id,
        date: appt.date,
        reason: appt.reason,
        condition: appt.condition,
        urgency: appt.urgency,
        patient: {
          _id: patientData._id,
          user: {
            name: userData.name,
            studentID: userData.studentID,
            staffID: userData.staffID,
            age: userData.age,
            gender: userData.gender,
            department: userData.department
          }
        },
        consultation: consultation,
        prescriptions: prescriptions
      };
    }));

    // Format patient data for response
    const userData = patient.user || {};
    
    res.json({
      success: true,
      patient: {
        _id: patient._id,
        user: {
          name: userData.name,
          studentID: userData.studentID,
          staffID: userData.staffID,
          age: userData.age,
          gender: userData.gender,
          department: userData.department
        },
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        emergencyContact: patient.emergencyContact
      },
      appointments: appointmentsWithDetails,
      totalVisits: appointments.length
    });
  } catch (error) {
    console.error('Error in getPatientRecords:', error);
    next(error);
  }
};

export const getRecordsStats = async (req, res, next) => {
  try {
    const completedAppointments = await Appointment.find({
      doctor: req.user._id,
      status: 'completed'
    });

    // Count by month
    const monthlyStats = {};
    const dailyStats = {};
    const conditionStats = {};
    const urgencyStats = { routine: 0, urgent: 0, emergency: 0 };

    completedAppointments.forEach(appt => {
      const date = new Date(appt.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const dayKey = date.toISOString().split('T')[0];
      
      monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + 1;
      dailyStats[dayKey] = (dailyStats[dayKey] || 0) + 1;
      
      // Count urgency
      const urgency = appt.urgency || 'routine';
      urgencyStats[urgency] = (urgencyStats[urgency] || 0) + 1;
      
      // Count conditions
      if (appt.condition) {
        conditionStats[appt.condition] = (conditionStats[appt.condition] || 0) + 1;
      }
    });

    // Get top conditions
    const topConditions = Object.entries(conditionStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        total: completedAppointments.length,
        monthly: monthlyStats,
        daily: dailyStats,
        urgency: urgencyStats,
        topConditions: topConditions
      }
    });
  } catch (error) {
    next(error);
  }
};