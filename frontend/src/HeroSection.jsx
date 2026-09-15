import React, { useState } from 'react'
import ecg from './assets/image.png'
import axios from 'axios'
import API from "./config/api";

const HeroSection = () => {
  const [status, setStatus] = useState(null);

  const getData = async () => {
    try {
      setStatus("Pinging backend...");
      const res = await axios.get(`${API}/api/system`);
      setStatus(res.data?.success ? "Backend online ✓" : "Backend responded without a success state");
    } catch (error) {
      console.log("Error", error);
      setStatus("Backend connection failed");
    }
  }

  return (
    <main className='HeroSection'>
      <div>
        <p className='text-sm uppercase tracking-[0.32em] text-cyan-400 font-mono'>Interactive backend portfolio</p>
        <h1 className='text-7xl font-bold'>Sanam Rai</h1>
        <p className='text-4xl text-neutral-300 font-mono'>Backend-focused Full Stack Developer</p>
        <p className='text-xl text-neutral-500 max-w-3xl text-center'>
          I do not only list backend skills here. Use the control panel below to switch authentication,
          persistence, caching, rate limiting, logging, and pagination on and off and observe how the system changes.
        </p>
        <div className='flex flex-wrap justify-center gap-2 text-sm font-mono text-neutral-400'>
          <span>Node.js</span><span>•</span><span>Express</span><span>•</span><span>MongoDB</span><span>•</span><span>JWT</span><span>•</span><span>API Architecture</span>
        </div>
        <div className='flex flex-wrap justify-center items-center'>
          <a href="#system-controls" className='rounded-full bg-cyan-400 text-black font-bold px-8 py-3 m-2'>Open Backend Lab ↓</a>
          <button
            className='rounded-full border border-cyan-500/40 bg-transparent fetchData text-white font-bold'
            onClick={getData}
          >
            <img src={ecg} alt="Backend status pulse" className='w-9'/>
            <span className='font-bold'>Ping API</span>
            <span>&gt;</span>
          </button>
        </div>
        {status && <p className='text-sm text-cyan-400 mt-2 font-mono' aria-live="polite">{status}</p>}
      </div>
    </main>
  )
}
export default HeroSection