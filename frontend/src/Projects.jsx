import React from 'react'
import axios from 'axios'
import API from "./config/api";
import { useState } from 'react';
import { useEffect } from 'react';
// left  to add pagination  footer UI
const Projects = (props) => {
  const url = `${API}/api/projects`;
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");
  const  [loading, setLoading] = useState(true);
  useEffect(()=>{
    const fetchData = async ()=>{
      try{
        setLoading(true);
        const response = await axios.get(url,{
          headers:{
            'Authorization': `Bearer ${localStorage.getItem("token")}`
          }
        });
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
        console.log(projects);
        setLoading(false);
        setMessage("Something Went Wrong!");
        setProjects([]);
      }
    }
    fetchData();
  },[props.systemToggle.db]);

  
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

          <a href={p.github} target="_blank" rel="noopener noreferrer">
            View Code
          </a>
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