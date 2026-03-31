import connectDB from '../config/db.js'
import projectModel from '../models/projectModel.js'
import mongoose from 'mongoose';
connectDB();

const data =[
  {
    "name": "YakTalk",
    "description": "YakTalk is a modern, real-time chat application demonstrating full-stack web development skills, leveraging Node.js for the backend and React for the dynamic user interface. It provides users with a seamless experience for instant messaging, including private chats and an online user presence indicator.",
    "techStacks": ["React", "Node", "MongoDB"]
  },
  {
    "name": "Document-to-PDF Converter",
    "description": "A simple yet efficient tool to convert documents like Word, TXT, or Markdown into PDF format with proper formatting and easy download functionality.",
    "techStacks": ["Node.js", "Express", "PDFKit"]
  },
  {
    "name": "CSV to Excel / JSON Converter",
    "description": "An online utility to convert CSV files into Excel spreadsheets or JSON format, enabling seamless data transformation and easy integration with other systems.",
    "techStacks": ["Node.js", "Express", "Pandas"]
  },
  {
    "name": "Event Scheduler with Reminders",
    "description": "A scheduler app that allows users to create events and set reminders, including email notifications for upcoming events to ensure nothing is missed.",
    "techStacks": ["Node.js", "Express", "Nodemailer", "MongoDB"]
  },
  {
    "name": "Data Visualization Dashboard",
    "description": "An interactive dashboard displaying charts and graphs to help visualize complex datasets for better insights and decision-making.",
    "techStacks": ["React", "Chart.js", "Node.js", "MongoDB"]
  },
  {
    "name": "URL Shortener Service",
    "description": "A service that generates shortened URLs for long links, tracking clicks and analytics to monitor engagement.",
    "techStacks": ["Node.js", "Express", "MongoDB"]
  },
  {
    "name": "QR Code Generator + Download",
    "description": "Generates QR codes for any URL or text and allows users to download the image for sharing or printing.",
    "techStacks": ["Node.js", "Express", "qrcode"]
  }
];

const seedProject = async ()=>{
    try{
        await projectModel.insertMany(data);
        console.log("Project Seeded");
        mongoose.connection.close();
    }
    catch(e){
        console.error(e.message);
        process.exit(1);
    }
};

seedProject();
