import User from '../models/User.js';
import Patient from '../models/Patient.js';
import { generateToken } from '../utils/jwt.js';
import crypto from "crypto";
import bcrypt from 'bcryptjs';


export const registerUser = async (req, res) => {
  try {
    const {
      name,
      role,
      studentID,
      staffID,
      department,
      age,
      gender,
      password,
    } = req.body;

    if (!name || !role || !password || !department) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, role, department and password",
      });
    }

    if (role !== "student" && role !== "staff") {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Allowed roles: student or staff",
      });
    }

    let existingUser = null;
    if (role === "student") {
      if (!studentID) {
        return res.status(400).json({
          success: false,
          message: "Student ID is required for student registration",
        });
      }
      existingUser = await User.findOne({ studentID });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Student ID already registered. Please use login.",
        });
      }
    } else if (role === "staff") {
      if (!staffID) {
        return res.status(400).json({
          success: false,
          message: "Staff ID is required for staff registration",
        });
      }
      existingUser = await User.findOne({ staffID });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Staff ID already exists. Please use login.",
        });
      }
    }

    const userData = {
      name,
      role,
      department,
      password,
    };

    if (role === "student") {
      userData.studentID = studentID;
    } else {
      userData.staffID = staffID;
    }

    if (age) userData.age = age;
    if (gender && ["male", "female"].includes(gender)) userData.gender = gender;

    // Create the User
    const user = await User.create(userData);

    const patientData = {
      user: user._id,
      department: department,
      age: age,
      gender: gender,
    };
    
    if (role === "student") {
      patientData.studentID = studentID;
    } else {
      patientData.staffID = staffID;
    }
    
    await Patient.create(patientData);
    console.log(`Patient record created for new user: ${user._id}`);

    // Prepare response
    const userResponse = {
      _id: user._id,
      id: user._id,
      name: user.name,
      role: user.role,
      department: user.department,
      age: user.age,
      gender: user.gender,
      studentID: user.studentID || null,
      staffID: user.staffID || null,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      token,
      user: userResponse,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Duplicate ${field}. Please use a different ID.`,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || "Server error during registration",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -resetPasswordToken -resetPasswordExpire");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const loginUser = async (req, res, next) => {
  try {
    const { role, id, password } = req.body;

    const allowedRoles = ["student", "nurse", "doctor", "admin", "staff", "principal-doctor", "pharmacist"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    if (!id || !password) {
      return res.status(400).json({ success: false, message: "ID and password are required" });
    }

    const query = role === "student" ? { studentID: id } : { staffID: id };
    let user = await User.findOne({ role, ...query });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,               
        id: user._id,                 
        name: user.name,
        role: user.role,
        studentID: user.studentID || null,
        staffID: user.staffID || null,
        department: user.department,  
        age: user.age,               
        gender: user.gender,         
        isActive: user.isActive,     
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { id } = req.body;

    const user = await User.findOne({ $or: [{ studentID: id }, { staffID: id }] });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    const email = `${id}@nileuniversity.edu.ng`;
    console.log(`Send reset link to ${email}`);
    console.log(`Reset token: ${resetToken}`);

    return res.json({ success: true, message: "Password reset link sent to institutional email" });

  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = name || user.name;
    // user.email = email || user.email; // If added to model

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: user.name,
        role: user.role,
        studentID: user.studentID,
        staffID: user.staffID,
      }
    });
  } catch (error) {
    next(error);
  }
};
