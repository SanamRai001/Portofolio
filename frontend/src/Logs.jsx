import React, { useEffect, useState } from 'react'
import axios from 'axios'
const Logs = (props) => {
  const [logs, setLogs] = useState([]);
  useEffect(()=>{
    const  fetchLogs= async ()=>{
      const res = await axios.get("http://localhost:5000/api/logs");
      if(res.data.success == true){
        setLogs(res.data.data);
      }
      else{
        console.log("No  logs  found!");
      }
    }
    fetchLogs();
    const interval = (fetchLogs, 2000);
    return ()=>clearInterval(interval);
  },[props.systemToggle.logging]);
  return (
    <>
        <div>
          {
            props.systemToggle.logging && 
            <div>
              {
              logs.length === 0 ?
              (<p>No  logs  yet</p>) :
              logs.map((log, index)=>(
                <p key={index}> {log} </p>
              ))}
            </div>
          }
        </div>
    </>
  )
}

export default Logs