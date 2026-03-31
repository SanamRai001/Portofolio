import React from 'react'
import axios from 'axios'
import { useState } from 'react';
import { useEffect } from 'react';

const Projects = () => {
  const url = "http://localhost:5000/api/projects";
  const [projects, setProjects] = useState([]);

  useEffect(()=>{
    const fetchData = async ()=>{
      try{
        const response = await axios.get(url);
        setProjects(response.data);
        console.log(response.data);
      }
      catch(e){
        console.error(e.message);
      }
    }
    fetchData();
  },[]);
  
  return (
    <>
    <div className='MainProject'>
      <div className='ProjectHead'>
        <h1 className='text-5xl'> Core Projects</h1>    
        <p className='text-xl'>Solutions designed for reliablity, scalablity, and performance.</p>
      </div>
      <div className='ProjectCards'>
        {projects.map((p)=>(
          <div key={p._id} className='ProjectCard'>
            <h1>{p.name}</h1>
            <p>{p.description}</p>
            <ul>
              {p.techStacks.map((t)=>(
                <li>{t}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    </>
  )
}

export default Projects