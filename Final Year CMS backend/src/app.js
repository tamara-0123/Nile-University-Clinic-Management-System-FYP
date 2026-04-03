import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';  
import { errorHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from "./routes/patientRoutes.js";
import nurseRoutes from "./routes/nurseRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import reportRoutes from './routes/reportRoutes.js';
import vitalRoutes from './routes/vitalRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import pharmacistRoutes from './routes/pharmacistRoutes.js';
import helmet from 'helmet';

const app = express();

//cross origin resource sharing
app.use(cors());

//json middleware
app.use(express.json());

//helmet for security
app.use(helmet());

//routes
app.use('/api/auth', authRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/nurse", nurseRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/doctor', vitalRoutes);
app.use('/api/doctor', admissionRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/pharmacist', pharmacistRoutes);
app.get('/', (req, res) => {
  res.json({message: "CMS Backend is running" });
})

//error middleware
app.use(errorHandler);


export default app;
