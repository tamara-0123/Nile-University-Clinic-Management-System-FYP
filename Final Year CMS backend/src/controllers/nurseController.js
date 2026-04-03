import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Vitals from "../models/Vitals.js";
import Consultation from "../models/Consultation.js";
import Notification from "../models/Notification.js";
import Admission from "../models/Admission.js";
import Availability from "../models/Availability.js";
import Prescription from "../models/Prescription.js";

export const getDailyQueue = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      date: { $gte: today },
      status: { $in: ["scheduled", "checked-in", "waiting", "in-consultation", "completed", "admitted"] },
    })
      .populate({
        path: "patient",
        populate: {
          path: "user",
          select: "name studentID staffID age gender department",
        }
      })
      .populate("doctor", "name")
      .sort({ date: 1 });

    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

export const recordVitals = async (req, res, next) => {
  try {
    const { bp, temperature, pulse, weight } = req.body;
    const { appointmentId } = req.params;

    const nurseId = req.user._id;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.status === "scheduled") {
      appointment.status = "checked-in";
      appointment.checkInTime = Date.now();
    } else if (appointment.status !== "checked-in") {
      return res.status(400).json({ success: false, message: "Patient must be checked-in first." });
    }

    if (!appointment.checkInTime) appointment.checkInTime = Date.now();
    await appointment.save();

    const vitals = await Vitals.create({
      appointment: appointmentId,
      patient: appointment.patient,
      recordedBy: nurseId,
      bp,
      temperature,
      pulse,
      weight,
    });

    const populatedVitals = await Vitals.findById(vitals._id)
      .populate({
        path: "patient",

        populate: {
          path: "user",
          select: "name studentID staffID",
        },

        select: "bloodGroup",
      })
      .populate({
        path: "recordedBy",
        select: "name",
      });

    res.status(201).json({
      success: true,
      message: "Vitals recorded successfully",
      vitals: populatedVitals,
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentVitals = async (req, res, next) => {
  try {
    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch vitals from today with populated patient and nurse info
    const vitals = await Vitals.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: 'name studentID staffID'
      }
    })
    .populate({
      path: 'recordedBy',
      select: 'name'
    })
    .sort({ createdAt: -1 }); // Most recent first

    res.status(200).json({
      success: true,
      count: vitals.length,
      vitals
    });
  } catch (error) {
    next(error);
  }
};

export const updatePatientStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate("patient");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = status;
    await appointment.save();

    await Notification.create({
      user: appointment.patient.user,
      title: "Appointment Status Updated",
      message: "Your clinic appointment status is now " + status + ".",
      type: "status",
    });

    res.json({
      success: true,
      message: "Patient status updated",
    });
  } catch (error) {
    next(error);
  }
};

export const viewBasicPatientRecord = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.patientId)
      .populate("user", "name studentID");

    const consultations = await Consultation.find()
      .populate({
        path: "appointment",
        match: { patient: patient._id },
      })
      .select("createdAt");

    res.json({
      success: true,
      patient,
      visitCount: consultations.length,
    });
  } catch (error) {
    next(error);
  }
};

export const nurseRescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newDate, reasonForChange } = req.body;

    const appointment = await Appointment.findById(id).populate({
      path: 'patient',
      populate: { path: 'user', select: 'name' }
    });

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    const oldDate = new Date(appointment.date).toLocaleString();
    appointment.date = newDate;
    await appointment.save();

    // Notify the Patient
    await Notification.create({
      user: appointment.patient.user._id,
      title: "Appointment Rescheduled by Clinic",
      type: "appointment",
      message: `Your appointment originally for ${oldDate} has been moved to ${new Date(newDate).toLocaleString()} by the nursing staff. Reason: ${reasonForChange || 'Schedule adjustment'}.`,
    });

    res.json({ success: true, message: "Appointment rescheduled and patient notified" });
  } catch (error) {
    next(error);
  }
};

export const nurseCancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findById(id).populate({
      path: 'patient',
      populate: { path: 'user', select: 'name' }
    });

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "cancelled";
    await appointment.save();

    // Notify the Patient
    await Notification.create({
      user: appointment.patient.user._id,
      title: "Appointment Cancelled by Clinic",
      type: "appointment",
      message: `Your appointment on ${new Date(appointment.date).toLocaleString()} has been cancelled by the clinic. Reason: ${cancellationReason || 'Staff unavailability'}.`,
    });

    res.json({ success: true, message: "Appointment cancelled and patient notified" });
  } catch (error) {
    next(error);
  }
};

// export const referPatient = async (req, res, next) => {
//   try {
//     const { doctorId } = req.body;

//     const appointment = await Appointment.findById(req.params.appointmentId);

//     if (!appointment) return res.status(404).json({ message: "Appointment not found" });

//     // Check if vitals exist for this appointment
//     const vitalsExist = await Vitals.findOne({ appointment: appointment._id });
//     if (!vitalsExist) {
//       return res.status(400).json({ success: false, message: "Please record vitals before referring to a doctor." });
//     }

//     appointment.doctor = doctorId;
//     appointment.status = "waiting";
//     await appointment.save();

//     await Notification.create({
//       user: doctorId,
//       message: "A patient has been referred to you.",
//       title: "New Patient Referral",
//       type: "referral",
//     });

//     res.json({
//       success: true,
//       message: "Patient referred to doctor",
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const referPatient = async (req, res, next) => {
  try {
    const { doctorId, condition, notes, urgency } = req.body;

    const appointment = await Appointment.findById(req.params.appointmentId);

    if (!appointment)
      return res.status(404).json({ message: "Appointment not found" });

    // Check if vitals exist
    const vitalsExist = await Vitals.findOne({ appointment: appointment._id });
    if (!vitalsExist) {
      return res.status(400).json({
        success: false,
        message: "Please record vitals before referring to a doctor."
      });
    }

    // ✅ UPDATE ALL REFERRAL FIELDS
    appointment.doctor = doctorId;
    appointment.condition = condition;
    appointment.clinicalNotes = notes;
    appointment.urgency = urgency;
    appointment.status = "waiting";

    await appointment.save();

    await Notification.create({
      user: doctorId,
      message: "A patient has been referred to you.",
      title: "New Patient Referral",
      type: "referral",
    });

    res.json({
      success: true,
      message: "Patient referred to doctor",
    });

  } catch (error) {
    next(error);
  }
};


// export const generateDailyReport = async (req, res, next) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);

//     const triagedRecords = await Vitals.find({
//       createdAt: { $gte: today, $lt: tomorrow },
//     })
//       .populate({
//         path: "patient",
//         populate: {
//           path: "user",
//           select: "name studentID staffID"
//         }
//       })
//       .sort({ createdAt: -1 });

//     // 2. Format the list for the report
//     const patientList = await Promise.all(triagedRecords.map(async (record) => {
//       const app = await Appointment.findById(record.appointment);

//       let waitTime = "--";
//       if (app && app.checkInTime) {
//         const diff = Math.floor((new Date(record.createdAt) - new Date(app.checkInTime)) / (1000 * 60));
//         waitTime = diff > 0 ? `${diff} min` : "0 min";
//       }

//       return {
//         name: record.patient?.user?.name || "Unknown",
//         id: record.patient?.user?.studentID || record.patient?.user?.staffID || "N/A",
//         time: record.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
//         checkInTime: app?.checkInTime ? new Date(app.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
//         completionTime: app?.completionTime ? new Date(app.completionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
//         waitTime,
//         vitalsId: record._id,
//         bp: record.bp,
//         temperature: record.temperature,
//         pulse: record.pulse
//       };
//     }));

//     const admissionsToday = await Admission.countDocuments({
//       createdAt: { $gte: today, $lt: tomorrow },
//       isActive: true
//     });

//     const dischargesToday = await Admission.countDocuments({
//       dischargeDate: { $gte: today, $lt: tomorrow },
//       isActive: false
//     });

//     res.json({
//       success: true,
//       report: {
//         date: today.toDateString(),
//         totalPatientsTriaged: triagedRecords.length,
//         admissionsToday,
//         dischargesToday,
//         patients: patientList,
//       },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

export const generateDailyReport = async (req, res, next) => {
  try {
    // 1️⃣ Parse date from query param
    const queryDate = req.query.queryDate ? new Date(req.query.queryDate) : new Date();
    queryDate.setHours(0, 0, 0, 0); // start of the day

    const nextDate = new Date(queryDate);
    nextDate.setDate(nextDate.getDate() + 1); // next day

    // 2️⃣ Get appointments for the day (instead of just vitals)
    const appointments = await Appointment.find({
      date: { $gte: queryDate, $lt: nextDate },
      status: { $in: ['scheduled', 'checked-in', 'waiting', 'in-consultation', 'completed', 'cancelled', 'admitted'] }
    })
      .populate({
        path: "patient",
        populate: {
          path: "user",
          select: "name studentID staffID"
        }
      })
      .populate("doctor", "name")
      .sort({ checkInTime: -1 });

    // 3️⃣ Get vitals for these appointments
    const appointmentIds = appointments.map(app => app._id);
    const vitalsRecords = await Vitals.find({
      appointment: { $in: appointmentIds }
    });

    // Create a map of vitals by appointment ID
    const vitalsMap = {};
    vitalsRecords.forEach(vital => {
      vitalsMap[vital.appointment.toString()] = vital;
    });

    // 4️⃣ Format patients list with actual appointment data
    const patientList = await Promise.all(appointments.map(async (app) => {
      const vital = vitalsMap[app._id.toString()];
      
      // Calculate wait time properly (time out - time in)
      let waitTime = "--";
      if (app.checkInTime && app.completionTime) {
        const diffMs = new Date(app.completionTime) - new Date(app.checkInTime);
        const diffMins = Math.floor(diffMs / (1000 * 60));
        waitTime = diffMins > 0 ? `${diffMins} min` : "0 min";
      } else if (app.checkInTime) {
        // If still checked in but not completed, calculate current wait time
        const diffMs = Date.now() - new Date(app.checkInTime);
        const diffMins = Math.floor(diffMs / (1000 * 60));
        waitTime = diffMins > 0 ? `${diffMins} min (ongoing)` : "0 min (ongoing)";
      }

      return {
        name: app.patient?.user?.name || "Unknown",
        id: app.patient?.user?.studentID || app.patient?.user?.staffID || "N/A",
        time: app.checkInTime ? new Date(app.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
        checkInTime: app.checkInTime ? new Date(app.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
        completionTime: app.completionTime ? new Date(app.completionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--",
        waitTime,
        condition: app.condition || "General Check-up", // Get condition from appointment
        status: app.status, // Get status from appointment
        urgency: app.urgency,
        vitalsId: vital?._id,
        bp: vital?.bp,
        temperature: vital?.temperature,
        pulse: vital?.pulse
      };
    }));

    // 5️⃣ Other summary stats
    const admissionsToday = await Admission.countDocuments({
      createdAt: { $gte: queryDate, $lt: nextDate },
      isActive: true
    });

    const dischargesToday = await Admission.countDocuments({
      dischargeDate: { $gte: queryDate, $lt: nextDate },
      isActive: false
    });

    const totalConsults = await Appointment.countDocuments({
      date: { $gte: queryDate, $lt: nextDate },
      status: 'completed'
    });

    const totalPrescriptions = await Prescription.countDocuments({
      createdAt: { $gte: queryDate, $lt: nextDate },
    });

    const totalPatientsTriaged = appointments.length;

    // 6️⃣ Send JSON response
    res.json({
      success: true,
      report: {
        date: queryDate.toDateString(),
        totalPatientsTriaged,
        admissionsToday,
        dischargesToday,
        totalConsults,
        totalPrescriptions,
        patients: patientList,
      },
    });

  } catch (error) {
    next(error); // let Express handle the error
  }
};


export const admitPatient = async (req, res, next) => {
  try {
    const { patientId, reason } = req.body;
    const nurseId = req.user._id;

    // Create the admission
    const admission = await Admission.create({
      patient: patientId,
      admittedBy: nurseId,
      dischargedBy: null,
      reason
    });

    // Populate names before sending the response
    const populatedAdmission = await Admission.findById(admission._id)
      .populate({
        path: "patient",
        populate: {
          path: "user",
          select: "name studentID staffID",
        },
      })
      .populate({
        path: "admittedBy",
        select: "name",
      });

    res.status(201).json({
      success: true,
      data: populatedAdmission
    });
  } catch (error) {
    next(error);
  }
};

export const dischargePatient = async (req, res, next) => {
  try {
    const { admissionId } = req.params;

    const admission = await Admission.findByIdAndUpdate(
      admissionId,
      {
        isActive: false,
        dischargeDate: Date.now(),
        dischargedBy: req.user._id
      },
      { new: true }
    );

    if (!admission) return res.status(404).json({ message: "Admission record not found" });

    res.json({ success: true, message: "Patient discharged successfully", data: admission });
  } catch (error) {
    next(error);
  }
};

export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: "doctor", isActive: true }).select("name staffID");

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const doctorsWithAvailability = await Promise.all(doctors.map(async (doc) => {
      const slots = await Availability.find({
        doctor: doc._id,
      });

      const appointmentCount = await Appointment.countDocuments({
        doctor: doc._id,
        date: { $gte: today, $lt: tomorrow },
        status: { $ne: "cancelled" }
      });

      return {
        ...doc.toObject(),
        totalSlots: slots.length,
        currentAppointments: appointmentCount,
        isFull: slots.length > 0 && appointmentCount >= slots.length,
        hasSlots: slots.length > 0
      };
    }));

    const pendingReferralsCount = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: "checked-in"
    });

    res.json({
      success: true,
      doctors: doctorsWithAvailability,
      pendingCount: pendingReferralsCount,
      availableDoctorsCount: doctorsWithAvailability.filter(d => !d.isFull).length
    });
  } catch (error) {
    next(error);
  }
};


export const getDashboardVitals = async (req, res, next) => {
  try {
    // Get today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Get only the most recent 10 vitals for dashboard
    const vitals = await Vitals.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        select: 'name studentID staffID'
      }
    })
    .populate({
      path: 'recordedBy',
      select: 'name'
    })
    .sort({ createdAt: -1 })
    .limit(10); // Limit to 10 most recent

    res.status(200).json({
      success: true,
      vitals
    });
  } catch (error) {
    next(error);
  }
};
