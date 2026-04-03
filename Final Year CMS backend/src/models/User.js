import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["student", "nurse", "pharmacist", "doctor", "principal-doctor", "admin", "staff"],
      required: true,
    },

    studentID: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return this.role === "student";
      },
    },

    staffID: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return ["nurse", "doctor", "principal-doctor", "admin", "staff"].includes(this.role);
      },
    },
    department: String,
    age: Number,
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    password: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);


// Hash password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);

});

// Compare password during login
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
