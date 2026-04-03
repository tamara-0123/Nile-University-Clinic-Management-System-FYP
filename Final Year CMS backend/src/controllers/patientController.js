import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Consultation from "../models/Consultation.js";
import Prescription from "../models/Prescription.js";
import Notification from "../models/Notification.js";
import Feedback from "../models/Feedback.js";

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    const patient = await Patient.findOne({ user: user._id });

    res.json({
      success: true,
      profile: {
        name: user.name,
        studentID: user.studentID,
        role: user.role,
        department: patient?.department,
        gender: patient?.gender,
      },
    });
  } catch (error) {
    next(error);
  }
};

const notifyNurses = async (title, message) => {
  const nurses = await User.find({ role: "nurse" });
  const notifications = nurses.map(nurse => ({
    user: nurse._id,
    title,
    message,
    type: "appointment"
  }));
  await Notification.insertMany(notifications);
};

export const bookAppointment = async (req, res, next) => {
  try {
    const { date, reason } = req.body;
    let patient = await Patient.findOne({ user: req.user._id }).populate('user');

    if (!patient) {
      patient = await Patient.create({ user: req.user._id });
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      date,
      reason,
      status: "scheduled",
    });

    await Notification.create({
      user: req.user._id,
      title: "Appointment Booked",
      message: "Your clinic appointment has been scheduled.",
      type: "appointment",
    });

    await notifyNurses(
      "New Appointment Booked",
      `A new appointment has been scheduled by ${patient.user.name} for ${new Date(date).toLocaleString()}.`
    );

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate({
      path: 'patient',
      populate: { path: 'user' }
    });

    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "cancelled";
    await appointment.save();

    await Notification.create({
      user: appointment.patient.user._id,
      title: "Appointment Cancelled",
      message: `Your appointment for ${new Date(appointment.date).toLocaleString()} was cancelled.`,
      type: "appointment",
    });

    await notifyNurses(
      "Appointment Cancelled",
      `The appointment for ${appointment.patient.user.name} on ${new Date(appointment.date).toLocaleString()} has been cancelled.`
    );

    res.json({ success: true, message: "Appointment cancelled" });
  } catch (error) {
    next(error);
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDate } = req.body;
    const appointment = await Appointment.findById(req.params.id).populate({
      path: 'patient',
      populate: { path: 'user' }
    });

    appointment.date = newDate;
    appointment.status = "scheduled";
    await appointment.save();

    await Notification.create({
      user: appointment.patient.user._id,
      title: "Appointment Rescheduled",
      type: "appointment",
      message: `Your appointment is now set for ${new Date(newDate).toLocaleString()}.`,
    });

    await notifyNurses(
      "Appointment Rescheduled",
      `${appointment.patient.user.name} rescheduled their visit to ${new Date(newDate).toLocaleString()}.`
    );

    res.json({ success: true, message: "Appointment rescheduled" });
  } catch (error) {
    next(error);
  }
};

export const getAppointmentHistory = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });

    const appointments = await Appointment.find({ patient: patient._id })
      .sort({ date: -1 })
      .populate("doctor", "name");

    res.json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

export const getMedicalHistory = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });

    if (!patient) {
      patient = await Patient.create({
        user: req.user._id,
        // Carry over IDs for the medical record
        studentID: req.user.studentID || null,
        staffID: req.user.staffID || null
      });
    }

    const appointments = await Appointment.find({ patient: patient._id }).select('_id');
    const appointmentIds = appointments.map(app => app._id);

    const consultations = await Consultation.find({
  appointment: { $in: appointmentIds }
})
.populate({
  path: 'appointment',
  select: 'date reason doctor',
  populate: {
    path: 'doctor',
    select: 'name' // Only send name
  }
})
.sort({ createdAt: -1 });


    res.json({
      success: true,
      profile: {
        bloodGroup: patient.bloodGroup || "Not Set",
        allergies: patient.allergies || [],
        chronicConditions: patient.chronicConditions || [],
        emergencyContact: patient.emergencyContact
      },
      history: consultations
    });
  } catch (error) {
    next(error);
  }
};

export const updateMedicalProfile = async (req, res, next) => {
  try {
    const { bloodGroup, allergies, chronicConditions, emergencyContact } = req.body;

    // findOneAndUpdate with 'upsert' will create the doc if it doesn't exist
    const patient = await Patient.findOneAndUpdate(
      { user: req.user._id },
      {
        bloodGroup,
        allergies, // Expecting an array of strings
        chronicConditions, // Expecting an array of strings
        emergencyContact, // Expecting an object { name: string, phone: string }
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Medical profile updated successfully",
      profile: patient,
    });
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ user: req.user._id });

    const prescriptions = await Prescription.find({ patient: patient._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, prescriptions });
  } catch (error) {
    next(error);
  }
};


export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    const { reason, details } = req.body;

    const feedback = await Feedback.create({
      user: req.user._id,
      reason,
      details
    });

    // SIMULATED EMAIL SENDING
    // In a production app, use nodemailer here
    console.log(`[EMAIL SERVICE] Sending Feedback Notification to admin@nileuniversity.edu.ng`);
    console.log(`[EMAIL CONTENT] User: ${req.user.name} (${req.user.role})\nSubject: ${reason}\nDetails: ${details}`);

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback
    });
  } catch (error) {
    next(error);
  }
};