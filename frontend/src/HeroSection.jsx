import React from 'react'
import ecg from './assets/image.png'
import axios from 'axios'

const HeroSection = (systemToggle) => {
  const handleSubmit = async ()=>{
    try{
      const res = await axios.post("http://localhost:5000/api/system", systemToggle);
      const data = await res.json();
      console.log("Server Response", data);
    }
    catch(error){
      console.error("Error sending data", error);
    }

  }
  return (
    <>
        <main className='HeroSection'>
          <div>
            <p className='text-7xl font-bold'>Sanam Rai</p>
            <p className='text-4xl text-neutral-600 font-mono'>Backend Developer</p>
            <p className='text-xl text-neutral-600 '>"I build fast, secure, and scalable backend systems."</p>
            <button className='rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 fetchData text-black font-bold' onClick={handleSubmit}> 
              <img src={ecg} alt="Ecg Image" className='w-9'/> <span className='font-bold'>Fetch Data</span>  <span>&gt;</span>
              </button>
          </div>
        </main>
      
    </>
)
}

export default HeroSection
