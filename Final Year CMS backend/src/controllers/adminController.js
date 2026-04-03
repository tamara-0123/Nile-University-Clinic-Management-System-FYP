import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Admission from "../models/Admission.js";
import Consultation from "../models/Consultation.js";
import Prescription from "../models/Prescription.js";


// Get all appointments with filters
export const getAppointments = async (req, res) => {
  try {
    const { fromDate, toDate, doctorId, patientId, status } = req.query;
    
    let query = {};
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) query.date.$gte = new Date(fromDate);
      if (toDate) query.date.$lte = new Date(toDate);
    }
    
    if (doctorId) query.doctor = doctorId;
    if (patientId) query.patient = patientId;
    if (status) query.status = status;
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'user')
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name studentID staffID department' }
      })
      .populate('doctor', 'name staffID role')
      .sort({ date: 1 });
    
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const { patientId, doctorId, date, reason, status, urgency } = req.body;
    
    // Find patient
    let patient = await Patient.findOne({ 
      $or: [
        { _id: patientId },
        { user: patientId }
      ]
    });
    
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found. Please register patient first.' 
      });
    }
    
    const appointment = new Appointment({
      patient: patient._id,
      doctor: doctorId || null,
      date: new Date(date),
      reason,
      status: status || 'scheduled',
      urgency: urgency || 'routine'
    });
    
    await appointment.save();
    
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'user')
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name studentID' }
      })
      .populate('doctor', 'name staffID');
    
    res.status(201).json({ success: true, appointment: populatedAppointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { doctorId, date, reason, status, urgency, checkInTime, completionTime } = req.body;
    
    const updateData = {};
    if (doctorId) updateData.doctor = doctorId;
    if (date) updateData.date = new Date(date);
    if (reason) updateData.reason = reason;
    if (status) updateData.status = status;
    if (urgency) updateData.urgency = urgency;
    if (checkInTime) updateData.checkInTime = new Date(checkInTime);
    if (completionTime) updateData.completionTime = new Date(completionTime);
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('patient', 'user')
     .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name studentID' }
      })
     .populate('doctor', 'name staffID');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get available doctors
export const getAvailableDoctors = async (req, res) => {
  try {
    const { date } = req.query;
    
    const doctors = await User.find({
      role: { $in: ['doctor', 'principal-doctor'] },
      isActive: true
    }).select('name staffID role');
    
    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'user')
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name studentID' }
      })
      .populate('doctor', 'name staffID role');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


// Get all staff users
export const getAllStaff = async (req, res, next) => {
  try {
    const users = await User.find({ role: { $in: ["doctor", "nurse", "staff", "pharmacist"] } }).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// Create a new user
export const createUser = async (req, res, next) => {
  try {
    const { name, role, staffID, studentID, password } = req.body;

    const userExists = await User.findOne({
      $or: [
        { staffID: staffID || undefined },
        { studentID: studentID || undefined }
      ].filter(q => q.staffID || q.studentID)
    });

    if (userExists) {
      return res.status(400).json({ success: false, message: "User with this ID already exists" });
    }

    const user = await User.create({
      name,
      role,
      staffID,
      studentID,
      password: password || "password123",
    });

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Update user status
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Update user details
export const updateUser = async (req, res, next) => {
  try {
    const { name, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = name || user.name;
    user.role = role || user.role;

    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// Send a broadcast notification
export const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type, targetRole } = req.body;

    const query = targetRole ? { role: targetRole } : {};
    const users = await User.find(query).select("_id");

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found to notify" });
    }

    const notifications = users.map((user) => ({
      user: user._id,
      title,
      message,
      type: type || "system",
    }));

    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Notification sent to ${users.length} users`,
    });
  } catch (error) {
    next(error);
  }
};

// Get ALL appointments within date range with patient and doctor info
export const getPatientRecords = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;

    const startDate = fromDate ? new Date(fromDate) : new Date(0);
    const endDate = toDate ? new Date(toDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    const appointments = await Appointment.find({
      date: { $gte: startDate, $lte: endDate }
    })
      .populate('doctor', 'name staffID role')
      .populate({
        path: 'patient',
        populate: { path: 'user', select: 'name studentID staffID department bloodGroup' }
      })
      .lean();

    const appointmentIds = appointments.map(apt => apt._id);
    const consultations = await Consultation.find({
      appointment: { $in: appointmentIds }
    }).lean();

    const consultationMap = consultations.reduce((map, c) => {
      map[c.appointment.toString()] = c;
      return map;
    }, {});

    const consultationIds = consultations.map(c => c._id);
    const prescriptions = await Prescription.find({
      consultation: { $in: consultationIds }
    }).lean();

    const prescriptionMap = prescriptions.reduce((map, p) => {
      const cid = p.consultation?.toString();
      if (cid) {
        if (!map[cid]) map[cid] = [];
        map[cid].push(p);
      }
      return map;
    }, {});

    const pharmacists = await User.find({ role: 'pharmacist', isActive: true })
      .select('name staffID').lean();
    const pharmacistMap = pharmacists.reduce((map, p) => {
      map[p._id.toString()] = p;
      return map;
    }, {});

    const records = appointments.map(apt => {
      const patient = apt.patient;
      const doctor = apt.doctor;
      const consultation = consultationMap[apt._id.toString()];
      const consultationPrescriptions = consultation ? prescriptionMap[consultation._id.toString()] || [] : [];

      let totalMeds = 0;
      const medications = [];

      consultationPrescriptions.forEach(p => {
        if (p.medications && p.medications.length) {
          totalMeds += p.medications.length;
          p.medications.forEach(med => {
            medications.push({
              name: med.name,
              dosage: med.dosage,
              frequency: med.frequency,
              duration: med.duration,
              instructions: med.instructions,
              status: p.status,
              isPendingPharmacist: med.isPendingPharmacist || false
            });
          });
        }
      });

      let pharmacistName = null;
      const completed = consultationPrescriptions.filter(p => p.status === 'completed');
      if (completed.length) {
        const last = completed[completed.length - 1];
        if (last.completedBy) {
          const ph = pharmacistMap[last.completedBy.toString()];
          if (ph) pharmacistName = ph.name;
        }
      }

      return {
        id: patient?.user?.studentID || patient?._id?.toString() || 'N/A',
        patientId: patient?._id,
        patientName: patient?.user?.name || 'Unknown',
        bloodGroup: patient?.user?.bloodGroup || patient?.bloodGroup || null,
        appointmentId: apt._id,
        appointmentDate: apt.date,
        diagnosis: consultation?.diagnosis || apt.reason || apt.condition || 'Check-up',
        doctorName: doctor?.name || 'Not assigned',
        doctorId: doctor?.staffID || doctor?._id?.toString() || '—',
        status: apt.status,
        urgency: apt.urgency || 'routine',
        consultationNotes: consultation?.notes || '',
        department: patient?.user?.department || 'N/A',
        prescriptionsCount: totalMeds,
        prescriptions: medications,
        pharmacistName: pharmacistName,
        hasPrescriptions: totalMeds > 0,
        rawAppointment: {
          reason: apt.reason,
          condition: apt.condition,
          hasConsultation: !!consultation
        }
      };
    });

    res.json({
      success: true,
      records,
      summary: {
        totalRecords: records.length,
        dateRange: {
          fromDate: startDate.toISOString().split('T')[0],
          toDate: endDate.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('Error in getPatientRecords:', error);
    res.status(500).json({
      success: false,
      message: 'Server error loading patient records',
      error: error.message
    });
  }
};

// Get single patient record
export const getPatientRecordById = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await Patient.findById(patientId)
      .populate('user', 'name studentID role')
      .lean();

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get all appointments for this patient
    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name staffID role')
      .sort({ date: -1 })
      .lean();

    // Get consultations for these appointments
    const appointmentIds = appointments.map(apt => apt._id);
    const consultations = await Consultation.find({
      appointment: { $in: appointmentIds }
    }).lean();

    // Create a map of appointmentId -> consultation
    const consultationMap = consultations.reduce((map, consultation) => {
      if (consultation.appointment) {
        map[consultation.appointment.toString()] = consultation;
      }
      return map;
    }, {});

    const patientName = patient.user?.name || 'Unknown';
    const studentId = patient.user?.studentID || patient._id.toString();

    res.json({
      success: true,
      patient: {
        id: studentId,
        _id: patient._id,
        name: patientName,
        studentID: studentId,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        chronicConditions: patient.chronicConditions,
        emergencyContact: patient.emergencyContact,
        appointments: appointments.map(apt => {
          const consultation = consultationMap[apt._id.toString()];
          return {
            id: apt._id,
            date: apt.date,
            diagnosis: consultation?.diagnosis || apt.reason || apt.condition || 'Check-up',
            consultationNotes: consultation?.notes || '',
            doctor: apt.doctor ? {
              name: apt.doctor.name,
              staffID: apt.doctor.staffID
            } : null,
            status: apt.status,
            urgency: apt.urgency
          };
        })
      }
    });

  } catch (error) {
    console.error('Error in getPatientRecordById:', error);
    next(error);
  }
};