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

    const totalPatientsTriaged = appointments.length;

    const patients = await Promise.all(appointments.map(async (apt) => {
      let patientId = 'N/A';
      let patientName = 'Unknown';
      
      if (apt.patient && apt.patient.user) {
        const user = apt.patient.user;
        patientName = user.name || 'Unknown';
        patientId = user.studentID || user.staffID || apt.patient._id.toString().slice(-6);
      }
      
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

    const diagnosisCounts = {};
    appointments.forEach(apt => {
      if (apt.condition && typeof apt.condition === 'string') {
        const condition = apt.condition.trim();
        diagnosisCounts[condition] = (diagnosisCounts[condition] || 0) + 1;
      }
    });

    const diagnoses = Object.entries(diagnosisCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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
    console.error('getDailyReport error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate daily report'
    });
  }
};

// Get weekly report with chart data
export const getWeeklyReport = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let startDate, endDate;
    
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    const appointments = await Appointment.find({
      date: { $gte: startDate, $lte: endDate }
    }).select('date');

    const dailyCounts = {};
    appointments.forEach(apt => {
      if (apt.date) {
        const dateKey = apt.date.toISOString().split('T')[0];
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
      }
    });

    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = [];
    const data = [];

    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      labels.push(days[date.getDay()]);
      const dateKey = date.toISOString().split('T')[0];
      data.push(dailyCounts[dateKey] || 0);
    }

    res.json({
      success: true,
      chartData: {
        labels,
        datasets: [{
          data,
          label: 'Visits',
          borderColor: '#003399',
          backgroundColor: 'rgba(0, 51, 153, 0.1)',
          tension: 0.3,
          fill: true
        }]
      }
    });
  } catch (error) {
    console.error('getWeeklyReport error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate weekly report' });
  }
};

// Get monthly diagnoses report (most popular diagnoses)
export const getMonthlyDiagnoses = async (req, res, next) => {
  try {
    const { fromDate, toDate } = req.query;
    
    let startDate, endDate;
    
    if (fromDate && toDate) {
      startDate = new Date(fromDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);
    }

    const appointments = await Appointment.find({
      date: { $gte: startDate, $lte: endDate },
      condition: { $exists: true, $ne: null }
    });

    const conditionCounts = {};
    appointments.forEach(apt => {
      if (apt.condition && typeof apt.condition === 'string') {
        const condition = apt.condition.trim();
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      }
    });

    const diagnoses = Object.entries(conditionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    res.json({
      success: true,
      diagnoses
    });
  } catch (error) {
    console.error('getMonthlyDiagnoses error:', error);
    res.status(500).json({ success: false, message: 'Failed to get diagnoses' });
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

    const conditionCounts = {};
    appointments.forEach(apt => {
      if (apt.condition && typeof apt.condition === 'string') {
        const condition = apt.condition.trim();
        conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
      }
    });

    const topComplaints = Object.entries(conditionCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const formattedPatients = await Promise.all(appointments.map(async (apt) => {
      let patientId = 'N/A';
      let patientName = 'Unknown';
      let diagnosis = 'Check-up';
      
      if (apt.patient && apt.patient.user) {
        const user = apt.patient.user;
        patientName = user.name || 'Unknown';
        patientId = user.studentID || user.staffID || apt.patient._id.toString().slice(-6);
      }
      
      if (apt.condition && typeof apt.condition === 'string') {
        diagnosis = apt.condition;
      } else if (apt.reason && typeof apt.reason === 'string') {
        diagnosis = apt.reason;
      }
      
      const wasAdmitted = admissions.some(adm => 
        adm.patient?._id.toString() === apt.patient?._id.toString()
      );
      
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
        diagnosis: diagnosis,
        date: apt.date,
        status: status,
        isAdmitted: isAdmitted
      };
    }));

    const summary = {
      totalVisits: appointments.length,
      totalAdmissions: admissions.length,
      totalDischarges: discharges.length,
      startDate: startDate.toLocaleDateString(),
      endDate: endDate.toLocaleDateString()
    };

    res.json({
      success: true,
      summary,
      patients: formattedPatients,
      topComplaints,
      appointments,
      admissions,
      discharges
    });
  } catch (error) {
    console.error('getDateRangeReport error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate report'
    });
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
      let diagnosis = 'Check-up';
      
      if (apt.patient && apt.patient.user) {
        const user = apt.patient.user;
        patientName = user.name || 'Unknown';
        patientId = user.studentID || user.staffID || apt.patient._id.toString().slice(-6);
      }
      
      if (apt.condition && typeof apt.condition === 'string') {
        diagnosis = apt.condition;
      } else if (apt.reason && typeof apt.reason === 'string') {
        diagnosis = apt.reason;
      }
      
      const activeAdmission = await Admission.findOne({ 
        patient: apt.patient?._id,
        isActive: true,
        dischargeDate: null
      });
      
      return {
        id: patientId,
        name: patientName,
        diagnosis: diagnosis,
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
    console.error('getRecentPatients error:', error);
    res.status(500).json({ success: false, message: 'Failed to get recent patients' });
  }
};