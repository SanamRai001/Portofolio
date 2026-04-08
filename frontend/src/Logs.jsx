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
  },[]);
  return (
    <>
        <div>
          {
            props.toggle.logging && 
            <div>
              {logs}
            </div>
          }
        </div>
    </>
  )
}

export default Logs