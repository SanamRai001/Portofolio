import connectDB from '../config/db.js'
import projectModel from '../models/projectModel.js'
import mongoose from 'mongoose';

connectDB();

const data = [
  {
    name: "YakTalk – Real-Time Chat Application",
    description:
      "A real-time chat application built using the MERN stack with Socket.io. Features include private messaging, online user tracking, and JWT-based authentication with secure password handling.",
    techStacks: ["React", "Node.js", "Express", "MongoDB", "Socket.io", "JWT", "bcrypt"],
    github: "https://github.com/SanamRai001/YakTalk-chatapp"
  },
  {
    name: "Phone Book CLI Application",
    description:
      "A command-line based contact management system supporting CRUD operations with input validation using regex and persistent storage using JSON.",
    techStacks: ["Python", "JSON", "Regex", "CLI"],
    github: "https://github.com/SanamRai001/PhoneBook-Application-"
  },
  {
    name: "Sample Portfolio Website",
    description:
      "A modular portfolio website built using Flask and Tailwind CSS to demonstrate backend routing and structured design principles.",
    techStacks: ["Flask", "Python", "Tailwind CSS"],
    github: "https://github.com/SanamRai001/Sample-Portofolio"
  },
  {
    name: "Backend-Controlled Portfolio System",
    description:
      "A dynamic portfolio application where system features like caching, authentication, rate limiting, and pagination can be toggled in real-time using a backend-driven control panel.",
    techStacks: ["React", "Node.js", "Express", "MongoDB", "JWT"],
    github: "https://github.com/SanamRai001/Portofolio"
  },
  {
    name: "Daily Dose of Motivation",
    description:
      "A simple application that delivers motivational quotes to users, focusing on clean UI and consistent user engagement.",
    techStacks: ["React", "Node.js"],
    github: "https://github.com/SanamRai001/Daily-Dose-of-Motivation"
  }
];
const seedProject = async () => {
  try {
    await projectModel.deleteMany();
    await projectModel.insertMany(data);

    console.log("✅ Projects Seeded (Clean & Real)");

    mongoose.connection.close();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
};

seedProject();