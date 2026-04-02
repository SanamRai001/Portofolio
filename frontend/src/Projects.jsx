import React from 'react'
import axios from 'axios'
import { useState } from 'react';
import { useEffect } from 'react';

const Projects = () => {
  const url = "http://localhost:5000/api/projects";
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");
  const  [loading, setLoading] = useState(true);
  useEffect(()=>{
    const fetchData = async ()=>{
      try{
        const response = await axios.get(url);
        setProjects(response.data.data);
        if(response.data.success == false){
          setMessage(response.data.message);
        }
        else{
          setMessage("");
        }
        console.log(response.data.data);
        console.log(response.data.message);
        setLoading(false);
      }
      catch(e){
        console.error(e.message);
      }
    }
    fetchData();
  },[]);

  
  return (
    <>
    {
      loading ? <p> Loading...</p> :  
      <div className='MainProject'>
      <div className='ProjectHead'>
        <h1 className='text-5xl'> Core Projects</h1>    
        <p className='text-xl'>Solutions designed for reliablity, scalablity, and performance.</p>
      </div>
      {
        message ? <p>{message}</p> : 
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

      }
      
    </div>
    }
   

    </>
  )
}

export default Projects