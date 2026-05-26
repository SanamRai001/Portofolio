import connectDB from '../config/db.js'
import projectModel from '../models/projectModel.js'
import mongoose from 'mongoose';

connectDB();

const data = [
  {
    name: "Krishi Bazar — Agricultural E-Commerce Marketplace",
    description:
      "A full-stack agricultural marketplace where Nepali farmers list produce and buyers purchase directly. Features JWT authentication, dual checkout flows (Cart and Buy Now), real-time cart management synced with MongoDB, skeleton loading screens, and a custom notification system built from scratch. Deployed on Render and Vercel with MongoDB Atlas.",
    techStacks: ["React", "Node.js", "Express", "MongoDB", "JWT", "Tailwind CSS", "Context API", "Mongoose"],
    github: "https://github.com/SanamRai001/KrishiBazar",
    live: "https://krishi-bazar-alpha.vercel.app"
  },
  {
    name: "Backend-Controlled Portfolio System",
    description:
      "A dynamic portfolio application where system features — JWT authentication, in-memory caching, rate limiting, pagination, and request logging — can each be toggled on or off independently at runtime through a backend control panel. Demonstrates production-level API architecture thinking.",
    techStacks: ["React", "Node.js", "Express", "MongoDB", "JWT"],
    github: "https://github.com/SanamRai001/Portofolio",
    live: "https://sanam-rai.com.np"
  },
  {
    name: "YakTalk — Secure Real-Time Chat Application",
    description:
      "A full-stack real-time messaging application with private chat, online presence tracking, and JWT-based authentication. Socket.IO connections secured server-side by verifying JWT during WebSocket handshake. Deployed with separate frontend and backend services on Render.",
    techStacks: ["React", "Node.js", "Express", "MongoDB", "Socket.io", "JWT", "bcrypt", "Tailwind CSS"],
    github: "https://github.com/SanamRai001/YakTalk-chatapp",
    live: "https://yaktalk-chatapp-1.onrender.com"
  },
  {
    name: "Phone Book CLI Application",
    description:
      "A command-line contact management system with full CRUD operations, regex input validation, JSON persistent storage, and Pytest unit tests — applying QA principles from professional internship to a personal project.",
    techStacks: ["Python", "JSON", "Regex", "Pytest", "CLI"],
    github: "https://github.com/SanamRai001/PhoneBook-Application-"
  },
  {
    name: "Daily Dose of Motivation",
    description:
      "A web application delivering daily motivational content, demonstrating clean JavaScript architecture and modular code organisation.",
    techStacks: ["React", "Node.js"],
    github: "https://github.com/SanamRai001/Daily-Dose-of-Motivation"
  },
  {
    name: "Sample Portfolio Website",
    description:
      "A modular portfolio website built using Flask and Tailwind CSS to demonstrate backend routing and structured design principles across different frameworks beyond Node.js.",
    techStacks: ["Flask", "Python", "Tailwind CSS"],
    github: "https://github.com/SanamRai001/Sample-Portofolio"
  }
];

const seedProjects = async () => {
  try {
    await projectModel.deleteMany();
    console.log("🗑️  Old projects cleared");

    await projectModel.insertMany(data);
    console.log(`✅ ${data.length} projects seeded successfully`);

    mongoose.connection.close();
  } catch(e) {
    console.error(e.message);
    process.exit(1);
  }
};

seedProjects();