import mongoose, { mongo } from "mongoose";

const schema = mongoose.Schema;

const systemSchema = new schema({
    auth: { type: Boolean, default: false },
  db: { type: Boolean, default: false },
  cache: { type: Boolean, default: false },
  logging: { type: Boolean, default: false },
  rateLimit: { type: Boolean, default: false },
  pagination: { type: Boolean, default: false },

  updatedAt: { type: Date, default: Date.now }
});

const System = mongoose.model("System", systemSchema);

export default System;
