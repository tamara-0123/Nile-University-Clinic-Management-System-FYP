import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Vitals from "../models/Vitals.js";
import Admission from "../models/Admission.js";


//Daily attendance report
export const dailyAttendanceReport = async (req, res, next) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const totalAppointments = await Appointment.countDocuments({
      createdAt: { $gte: startOfDay },
    });

    const completedAppointments = await Appointment.countDocuments({
      createdAt: { $gte: startOfDay },
      status: "completed",
    });

    res.json({
      success: true,
      data: {
        date: startOfDay,
        totalAppointments,
        completedAppointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

//monthly patient report
export const monthlyVisitSummary = async (req, res, next) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const summary = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

//Doctor Performance Report
export const doctorWorkloadReport = async (req, res, next) => {
  try {
    const workload = await Appointment.aggregate([
      { $match: { doctor: { $ne: null } } },
      {
        $group: {
          _id: "$doctor",
          patientCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctor",
        },
      },
      { $unwind: "$doctor" },
      {
        $project: {
          _id: 0,
          doctorName: "$doctor.name",
          patientCount: 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: workload,
    });
  } catch (error) {
    next(error);
  }
};

//Nurse Activity Report
export const nurseActivityReport = async (req, res, next) => {
  try {
    const [vitalsStats, admissionStats, dischargeStats] = await Promise.all([
      // Count Vitals recorded by each nurse
      Vitals.aggregate([
        { $group: { _id: "$recordedBy", vitalsCount: { $sum: 1 } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "nurse" } },
        { $unwind: "$nurse" },
        { $project: { _id: 1, name: "$nurse.name", vitalsCount: 1 } }
      ]),

      // Count Admissions processed by each nurse
      Admission.aggregate([
        { $group: { _id: "$admittedBy", admissionCount: { $sum: 1 } } }
      ]),

      // Count Discharges 
      Admission.aggregate([
        { $match: { isActive: false } },
        { $group: { _id: "$admittedBy", dischargeCount: { $sum: 1 } } }
      ])
    ]);

    // Merge results into a single array
    const combinedReport = vitalsStats.map(nurse => {
      const admissions = admissionStats.find(a => a._id.toString() === nurse._id.toString());
      const discharges = dischargeStats.find(d => d._id.toString() === nurse._id.toString());

      return {
        nurseName: nurse.name,
        vitalsTaken: nurse.vitalsCount,
        admissionsHandled: admissions ? admissions.admissionCount : 0,
        dischargesHandled: discharges ? discharges.dischargeCount : 0,
        totalActions: nurse.vitalsCount + (admissions?.admissionCount || 0) + (discharges?.dischargeCount || 0)
      };
    });

    res.json({
      success: true,
      data: combinedReport,
    });
  } catch (error) {
    next(error);
  }
};

//Admission and Discharge Report
export const getAdmissionDischargeReport = async (req, res, next) => {
  try {
    const { type } = req.query; // 'daily' or 'monthly'
    
    const dateFormat = type === 'monthly' ? "%Y-%m" : "%Y-%m-%d";

    const report = await Admission.aggregate([
      {
        $facet: {
          // Process Admissions
          "admissions": [
            {
              $group: {
                _id: { $dateToString: { format: dateFormat, date: "$admissionDate" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          // Process Discharges 
          "discharges": [
            { $match: { isActive: false, dischargeDate: { $ne: null } } },
            {
              $group: {
                _id: { $dateToString: { format: dateFormat, date: "$dischargeDate" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        periodType: type || 'daily',
        stats: report[0]
      }
    });
  } catch (error) {
    next(error);
  }
};


