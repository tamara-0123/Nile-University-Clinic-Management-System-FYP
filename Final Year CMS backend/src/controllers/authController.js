import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import crypto from "crypto";
import bcrypt from 'bcryptjs';

export const loginUser = async (req, res, next) => {
  try {
    const { role, id, name, password } = req.body;

    // Validate role
    const allowedRoles = ["student", "nurse", "doctor", "admin", "staff", "principal-doctor", "pharmacist"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // Validate required fields
    if (!id || !password) {
      return res.status(400).json({ success: false, message: "ID and password are required" });
    }

    const query = role === "student" ? { studentID: id } : { staffID: id };

    let user = await User.findOne({ role, ...query });

    // STRICT LOGIN: User must exist
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please contact administration or use a valid ID." });
    }

    // Existing user → check active status
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        name: user.name,
        role: user.role,
        studentID: user.studentID || null,
        staffID: user.staffID || null,
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
