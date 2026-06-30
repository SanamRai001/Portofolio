import React from 'react'
import axios from 'axios'
import API from "./config/api";
import { useState, useEffect } from 'react';
import ProjectCard from './reusable/ProjectCard';

const Projects = (props) => {
  const url = `${API}/api/projects`;
  const [projects, setProjects] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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
        setMessage(response.data.success === false ? response.data.message : "");
      }
      catch(e){
        console.error(e.message);
        setMessage("Something Went Wrong!");
        setProjects([]);
      }
      finally{
        setLoading(false);
      }
    }
    fetchData();
  },[props.systemToggle.db]);

  return (
    <>
      {loading ? <p>Loading...</p> :
        <div className='MainProject'>
          <div className='ProjectHead'>
            <h1 className='text-5xl'>Core Projects</h1>
            <p className='text-xl'>Solutions designed for reliablity, scalablity, and performance.</p>
          </div>
          {message ? <p>{message}</p> :
            <div className='ProjectCards'>
              {projects.map((p)=>(
                <ProjectCard key={p._id} project={p} />
              ))}
            </div>
          }
        </div>
      }
    </>
  )
}
export default Projects