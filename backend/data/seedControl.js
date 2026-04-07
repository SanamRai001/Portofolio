import mongoose from "mongoose";
import controlModel from "../models/controlModel.js";
import connectDB from "../config/db.js";

connectDB();

const data = [
  {
    key: "db",
    title: "Database System",
    description: "Controls whether the application connects to MongoDB.",
    details:
      "If disabled, the system will not initialize MongoDB. All persistent data operations will fallback or fail."
  },
  {
    key: "auth",
    title: "Authentication System",
    description: "Enables login and user session validation.",
    details:
      "When disabled, all routes become publicly accessible without JWT verification."
  },
  {
    key: "rateLimit",
    title: "Rate Limiting",
    description: "Limits number of incoming requests per IP/user.",
    details:
      "Prevents API abuse by restricting excessive requests within a time window."
  },
  {
    key: "logging",
    title: "System Logging",
    description: "Tracks system activity and errors.",
    details:
      "Logs requests, authentication events, and system errors for debugging."
  },
  {
    key: "cache",
    title: "Caching Layer",
    description: "Improves performance using temporary stored responses.",
    details:
      "Reduces database load by caching frequently accessed data."
  },
  {
    key: "pagination",
    title: "Pagination System",
    description: "Splits large data into pages.",
    details:
      "Improves performance and UX when handling large datasets."
  }
];

const seed = async () => {
  try {
    await controlModel.deleteMany(); // important for clean re-seed
    await controlModel.insertMany(data);

    console.log("✅ Seeding Completed");

    mongoose.connection.close();
  } catch (e) {
    console.error("❌ Seeding Error:", e.message);
    process.exit(1);
  }
};

seed();