import mongoose from "mongoose";
import controlModel from "../models/controlModel.js";
import connectDB from "../config/db.js";
connectDB();
const data = [
  {
    key: "database",
    title: "Database Enabled",
    description: "Controls whether the application connects to the database.",
    details: "If disabled, the server will not initialize any MongoDB connection. All persistent data operations will fail."
  },
  {
    key: "authentication",
    title: "Authentication Enabled",
    description: "Enables user authentication and session validation.",
    details: "When disabled, protected routes will be publicly accessible without login verification."
  },
  {
    key: "authorization",
    title: "Role-Based Authorization",
    description: "Enforces role-based access control (RBAC).",
    details: "Users will only access resources permitted by their assigned roles (admin, user, moderator, etc.)."
  },
  {
    key: "rate_limiting",
    title: "Rate Limiting",
    description: "Limits number of incoming requests per IP/user.",
    details: "Helps prevent brute-force attacks and API abuse by restricting excessive requests."
  },
  {
    key: "cors",
    title: "CORS Protection",
    description: "Controls cross-origin resource sharing rules.",
    details: "Defines which domains are allowed to access backend APIs."
  },
  {
    key: "logging",
    title: "System Logging",
    description: "Enables server-side request and error logging.",
    details: "Logs API requests, authentication attempts, and system errors for monitoring and debugging."
  },
  {
    key: "caching",
    title: "Caching Layer",
    description: "Enables response caching for improved performance.",
    details: "Frequently requested data is stored temporarily to reduce database load."
  },
  {
    key: "email_service",
    title: "Email Service",
    description: "Controls outgoing email notifications.",
    details: "Handles account verification emails, password resets, and system alerts."
  },
  {
    key: "file_upload",
    title: "File Upload Service",
    description: "Enables file and image uploads.",
    details: "Handles multipart form data and manages storage location."
  },
  {
    key: "maintenance_mode",
    title: "Maintenance Mode",
    description: "Temporarily disables public access to the application.",
    details: "Shows a maintenance page to users while system updates or fixes are being applied."
  },
  {
    key: "api_monitoring",
    title: "API Monitoring",
    description: "Tracks API performance and uptime.",
    details: "Collects metrics such as response time, error rate, and request volume."
  },
  {
    key: "security_headers",
    title: "Security Headers",
    description: "Enables HTTP security headers.",
    details: "Adds headers like Helmet to improve protection against common vulnerabilities."
  }
];
const seed = async()=>{
    try{
        await controlModel.insertMany(data);
        console.log("Seeding Completed");
        mongoose.connection.close()
    }
    catch(e){
        console.error(e.message);
        process.exit(1)
    }

}
seed();
