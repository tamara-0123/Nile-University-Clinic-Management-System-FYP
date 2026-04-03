import Appointment from "../models/Appointment.js";
import Admission from "../models/Admission.js";
import Patient from "../models/Patient.js";
import User from "../models/User.js";

// Get daily report (ONLY today's info)
export const getDailyReport = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's appointments with proper population
    const appointments = await Appointment.find({
      date: { $gte: today, $lt: tomorrow }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name studentID staffID role'
      }
    })
    .populate('doctor', 'name')
    .sort({ date: -1 });

    // Get today's admissions (patients admitted today)
    const admissions = await Admission.find({
      admissionDate: { $gte: today, $lt: tomorrow },
      isActive: true
    }).populate({
      path: 'patient',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name studentID staffID role'
      }
    });

    // Get today's discharges (patients discharged today)
    const discharges = await Admission.find({
      dischargeDate: { $gte: today, $lt: tomorrow }
    }).populate({
      path: 'patient',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name studentID staffID role'
      }
    });

    // Calculate visits (total patients seen today)
    const totalPatientsTriaged = appointments.length;

    // Get patients with their current status
    const patients = await Promise.all(appointments.map(async (apt) => {
      // Get patient ID from user model (studentID or staffID)
      let patientId = 'N/A';
      let patientName = 'Unknown';
      
      if (apt.patient && apt.patient.user) {
        const user = apt.patient.user;
        patientName = user.name || 'Unknown';
        // Use studentID for students, staffID for staff/doctors/nurses
        patientId = user.studentID || user.staffID || apt.patient._id.toString().slice(-6);
      }
      
      // Check if patient is CURRENTLY admitted (no discharge date)
      const activeAdmission = await Admission.findOne({ 
        patient: apt.patient?._id,
        isActive: true,
        dischargeDate: null
      });
      
      return {
        id: patientId,
        name: patientName,
        diagnosis: apt.condition || apt.reason || 'Check-up',
        time: apt.date ? new Date(apt.date).toLocaleTimeString() : '--',
        status: activeAdmission ? 'admitted' : apt.status,
        isAdmitted: activeAdmission ? 'Yes' : 'No',
        checkInTime: apt.checkInTime,
        completionTime: apt.completionTime,
        date: apt.date
      };
    }));

    // Get today's diagnoses distribution
    const diagnoses = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today, $lt: tomorrow },
          condition: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      report: {
        totalPatientsTriaged,
        admissionsToday: admissions.length,
        dischargesToday: discharges.length,
        patients,
        diagnoses,
        date: today,
        period: 'today'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get weekly report with chart data
export const getWeeklyReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let startDate, endDate;
    
    if (fromDate && toDate) {
      // Use provided date range
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 7 days
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    // Get daily visit counts for the date range
    const dailyVisits = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Calculate number of days in range
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // Format for chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = [];
    const data = [];

    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      labels.push(days[date.getDay()]);
      
      const visit = dailyVisits.find(v => 
        v._id.year === date.getFullYear() &&
        v._id.month === date.getMonth() + 1 &&
        v._id.day === date.getDate()
      );
      data.push(visit ? visit.count : 0);
    }

    res.json({
      success: true,
      chartData: {
        labels,
        datasets: [{
          data,
          borderColor: '#003399',
          tension: 0.3
        }]
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get monthly diagnoses report (most popular diagnoses)
export const getMonthlyDiagnoses = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let startDate, endDate;
    
    if (fromDate && toDate) {
      // Use provided date range
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to current month
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    // Get diagnosis counts for the period
    const diagnoses = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          condition: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // If no diagnoses found, provide default data
    if (diagnoses.length === 0) {
      return res.json({
        success: true,
        diagnoses: [
          { name: 'No diagnoses recorded', count: 1 }
        ]
      });
    }

    res.json({
      success: true,
      diagnoses: diagnoses.map(d => ({ 
        name: d._id || 'Unknown', 
        count: d.count 
      }))
    });
  } catch (error) {
    next(error);
  }
};

// Get filtered report by date range (for immediate updates)
export const getDateRangeReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    
    if (!fromDate || !toDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide both fromDate and toDate' 
      });
    }
    
    const startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    // Get appointments in range with proper population
    const appointments = await Appointment.find({
      date: { $gte: startDate, $lte: endDate }
    })
    .populate({
      path: 'patient',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name studentID staffID role'
      }
    })
    .populate('doctor', 'name')
    .sort({ date: -1 });

    // Get admissions in range
    const admissions = await Admission.find({
      admissionDate: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'patient',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name studentID staffID role'
      }
    });

    // Get discharges in range
    const discharges = await Admission.find({
      dischargeDate: { $gte: startDate, $lte: endDate }
    }).populate({
      path: 'patient',
      populate: {
        path: 'user',
        model: 'User',
        select: 'name studentID staffID role'
      }
    });

    // Format patients for display
    const formattedPatients = await Promise.all(appointments.map(async (apt) => {
      let patientId = 'N/A';
      let patientName = 'Unknown';
      
      if (apt.patient && apt.patient.user) {
        const user = apt.patient.user;
        patientName = user.name || 'Unknown';
        patientId = user.studentID || user.staffID || apt.patient._id.toString().slice(-6);
      }
      
      // Check if patient was admitted during this period and still active
      const wasAdmitted = admissions.some(adm => 
        adm.patient?._id.toString() === apt.patient?._id.toString()
      );
      
      // Check if patient was discharged during this period
      const wasDischarged = discharges.some(dis => 
        dis.patient?._id.toString() === apt.patient?._id.toString()
      );
      
      let status = apt.status;
      let isAdmitted = 'No';
      
      if (wasAdmitted && !wasDischarged) {
        status = 'admitted';
        isAdmitted = 'Yes';
      } else if (wasDischarged) {
        status = 'discharged';
        isAdmitted = 'No';
      }
      
      return {
        id: patientId,
        name: patientName,
        diagnosis: apt.condition || apt.reason || 'Check-up',
        date: apt.date,
        status: status,
        isAdmitted: isAdmitted
      };
    }));

    // Summary statistics
    const summary = {
      totalVisits: appointments.length,
      totalAdmissions: admissions.length,
      totalDischarges: discharges.length,
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString()
    };

    // Get diagnoses for this period
    const diagnoses = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          condition: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      summary,
      patients: formattedPatients,
      diagnoses: diagnoses.map(d => ({ name: d._id, count: d.count })),
      appointments,
      admissions,
      discharges
    });
  } catch (error) {
    next(error);
  }
};

// Get recent patients list
export const getRecentPatients = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const appointments = await Appointment.find()
      .sort({ date: -1 })
      .limit(limit)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name studentID staffID role'
        }
      });

    const patients = await Promise.all(appointments.map(async (apt) => {
      let patientId = 'N/A';
      let patientName = 'Unknown';
      
      if (apt.patient && apt.patient.user) {
        const user = apt.patient.user;
        patientName = user.name || 'Unknown';
        patientId = user.studentID || user.staffID || apt.patient._id.toString().slice(-6);
      }
      
      // Check if patient is CURRENTLY admitted (active and no discharge date)
      const activeAdmission = await Admission.findOne({ 
        patient: apt.patient?._id,
        isActive: true,
        dischargeDate: null
      });
      
      return {
        id: patientId,
        name: patientName,
        diagnosis: apt.condition || apt.reason || 'Check-up',
        date: apt.date,
        status: activeAdmission ? 'admitted' : apt.status,
        isAdmitted: activeAdmission ? 'Yes' : 'No'
      };
    }));

    res.json({
      success: true,
      patients
    });
  } catch (error) {
    next(error);
  }
};