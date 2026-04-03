import Prescription from "../models/Prescription.js";
import Consultation from "../models/Consultation.js";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Vitals from "../models/Vitals.js";
import Notification from "../models/Notification.js";
export const getPendingPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await Prescription.find({ 
      status: 'pending-pharmacist' 
    })
    .populate({
      path: "consultation",
      populate: {
        path: "appointment",
        populate: [
          { path: "patient", populate: { path: "user" } },
          { path: "doctor", select: "name" }
        ]
      }
    })
    .populate("createdBy", "name")
    .sort({ createdAt: 1 });

    // Transform to include urgency from appointment
    const transformedPrescriptions = prescriptions.map(p => {
      const pObj = p.toObject();
      // Get urgency from the appointment if available
      const urgency = p.consultation?.appointment?.urgency || 'routine';
      pObj.urgency = urgency;
      return pObj;
    });

    res.json({ success: true, prescriptions: transformedPrescriptions });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionHistory = async (req, res, next) => {
    try {
        const { patientId, fromDate, toDate, status } = req.query;
        let query = { status: 'completed' };

        if (status) {
            query.status = status;
        }

        if (patientId) {
            query.patient = patientId;
        }

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) query.createdAt.$gte = new Date(fromDate);
            if (toDate) query.createdAt.$lte = new Date(toDate);
        }

        const prescriptions = await Prescription.find(query)
            .populate({
                path: "consultation",
                populate: {
                    path: "appointment",
                    populate: [
                        { path: "patient", populate: { path: "user" } },
                        { path: "doctor", select: "name" }
                    ]
                }
            })
            .populate("createdBy", "name")
            .populate("completedBy", "name")
            .sort({ createdAt: -1 });

        // Transform to include urgency from appointment
        const transformedPrescriptions = prescriptions.map(p => {
            const pObj = p.toObject();
            const urgency = p.consultation?.appointment?.urgency || 'routine';
            pObj.urgency = urgency;
            return pObj;
        });

        res.json({ success: true, prescriptions: transformedPrescriptions });
    } catch (error) {
        next(error);
    }
};

export const getPrescriptionVitals = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId)
      .populate({
        path: "consultation",
        populate: {
          path: "appointment",
          populate: { 
            path: "patient",
            populate: { path: "user" }
          }
        }
      });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Get patient details from the consultation
    const patient = prescription.consultation?.appointment?.patient;
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Populate patient user details
    await patient.populate('user');

    // Get latest vitals for the patient
    const vitals = await Vitals.find({ 
      patient: prescription.patient 
    })
    .populate("recordedBy", "name")
    .sort({ createdAt: -1 })
    .limit(5);

    // Get patient medical history from consultations with their prescriptions
    const consultations = await Consultation.find({
      appointment: { $in: await Appointment.find({ patient: prescription.patient }).distinct('_id') }
    })
    .populate({
      path: "appointment",
      populate: { path: "doctor", select: "name" }
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // For each consultation, get the associated prescriptions
    const consultationsWithPrescriptions = await Promise.all(consultations.map(async (consultation) => {
      const prescriptionsForConsultation = await Prescription.find({ 
        consultation: consultation._id 
      });
      
      // Extract all medications from all prescriptions for this consultation
      const medications = [];
      prescriptionsForConsultation.forEach(prescription => {
        if (prescription.medications && prescription.medications.length > 0) {
          prescription.medications.forEach(med => {
            medications.push({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              instructions: med.instructions,
              status: prescription.status
            });
          });
        }
      });
      
      return {
        _id: consultation._id,
        createdAt: consultation.createdAt,
        diagnosis: consultation.diagnosis,
        notes: consultation.notes,
        appointment: consultation.appointment,
        prescriptions: medications
      };
    }));

    res.json({ 
      success: true, 
      patient: {
        _id: patient._id,
        user: {
          name: patient.user?.name || null,
          studentID: patient.user?.studentID || null,
          staffID: patient.user?.staffID || null,
          age: patient.user?.age || null,
          gender: patient.user?.gender || null,
          department: patient.user?.department || patient.department || null
        },
        bloodGroup: patient.bloodGroup || null,
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || []
      },
      vitals,
      medicalHistory: consultationsWithPrescriptions
    });
  } catch (error) {
    console.error('Error in getPrescriptionVitals:', error);
    next(error);
  }
};

export const completePrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (prescription.status !== 'pending-pharmacist') {
      return res.status(400).json({ message: "Prescription already processed" });
    }

    const { medications } = req.body;

    if (!medications || medications.length === 0) {
      return res.status(400).json({ message: "Medication details are required" });
    }

    // Update the prescription with complete details
    prescription.medications = medications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
      quantity: med.quantity,
      isPendingPharmacist: false
    }));
    
    prescription.status = 'completed';
    prescription.completedBy = req.user._id;
    prescription.completedAt = new Date();
    
    await prescription.save();

    // Get patient to send notification
    const consultation = await Consultation.findById(prescription.consultation)
      .populate({
        path: "appointment",
        populate: { path: "patient", populate: { path: "user" } }
      });

    if (consultation && consultation.appointment && consultation.appointment.patient) {
      // Send notification to patient
      await Notification.create({
        user: consultation.appointment.patient.user._id,
        title: "Prescription Ready",
        message: `Your prescription for ${medications.map(m => m.name).join(', ')} is ready for pickup.`,
        type: "prescription",
      });

      // Send notification to doctor
      if (prescription.createdBy) {
        await Notification.create({
          user: prescription.createdBy,
          title: "Prescription Completed",
          message: `Prescription for ${consultation.appointment.patient.user.name} has been completed by pharmacist`,
          type: "prescription",
        });
      }
    }

    res.json({ 
      success: true, 
      message: "Prescription completed successfully",
      prescription 
    });
  } catch (error) {
    next(error);
  }
};

export const getPharmacistStats = async (req, res, next) => {
  try {
    const pendingCount = await Prescription.countDocuments({ status: 'pending-pharmacist' });
    const completedToday = await Prescription.countDocuments({ 
      status: 'completed',
      completedAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    // Get all pending prescriptions with their consultation and appointment to get urgency
    const pendingPrescriptions = await Prescription.find({ status: 'pending-pharmacist' })
      .populate({
        path: "consultation",
        populate: {
          path: "appointment",
          select: "urgency"
        }
      });
    
    // Count by urgency from appointment
    let emergencyCount = 0;
    let urgentCount = 0;
    let routineCount = 0;
    
    pendingPrescriptions.forEach(p => {
      const urgency = p.consultation?.appointment?.urgency || 'routine';
      if (urgency === 'emergency') emergencyCount++;
      else if (urgency === 'urgent') urgentCount++;
      else routineCount++;
    });

    res.json({ 
      success: true, 
      stats: {
        pending: pendingCount,
        completedToday,
        emergency: emergencyCount,
        urgent: urgentCount,
        routine: routineCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId)
      .populate({
        path: "consultation",
        populate: {
          path: "appointment",
          populate: [
            { path: "patient", populate: { path: "user" } },
            { path: "doctor", select: "name" }
          ]
        }
      })
      .populate("createdBy", "name")
      .populate("completedBy", "name");

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    res.json({ success: true, prescription });
  } catch (error) {
    next(error);
  }
};

export const updateCompletedPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    // Allow updates to completed prescriptions
    if (prescription.status !== 'completed') {
      return res.status(400).json({ message: "Only completed prescriptions can be updated" });
    }

    const { medications } = req.body;

    if (!medications || medications.length === 0) {
      return res.status(400).json({ message: "Medication details are required" });
    }

    // Update the prescription with new details
    prescription.medications = medications.map(med => ({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
      quantity: med.quantity,
      isPendingPharmacist: false
    }));
    
    prescription.version += 1; // Increment version on update
    
    await prescription.save();

    // Get patient to send notification about update
    const consultation = await Consultation.findById(prescription.consultation)
      .populate({
        path: "appointment",
        populate: { path: "patient", populate: { path: "user" } }
      });

    if (consultation && consultation.appointment && consultation.appointment.patient) {
      // Send notification to patient about update
      await Notification.create({
        user: consultation.appointment.patient.user._id,
        title: "Prescription Updated",
        message: `Your prescription for ${medications.map(m => m.name).join(', ')} has been updated by the pharmacist.`,
        type: "prescription",
      });

      // Send notification to doctor
      if (prescription.createdBy) {
        await Notification.create({
          user: prescription.createdBy,
          title: "Prescription Updated",
          message: `Prescription for ${consultation.appointment.patient.user.name} has been updated by pharmacist ${req.user.name}`,
          type: "prescription",
        });
      }
    }

    res.json({ 
      success: true, 
      message: "Prescription updated successfully",
      prescription 
    });
  } catch (error) {
    console.error('Error updating prescription:', error);
    next(error);
  }
};
