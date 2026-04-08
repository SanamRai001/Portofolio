import React, { useEffect, useState } from 'react'
import Toggle from './reusable/Toggle'
import axios from 'axios';
const SystemControl = (props) => {
    const [toggle,  setToggle] = useState(
        {
            auth:false,
            db: false,
            cache: false,
            logging: false,
            rateLimit: false,
            pagination: false
        }
    );
    const [activeControl, setActiveControl] = useState("");
    const [controls, setControls] = useState([]);
    const selected = controls.find(c=>c.key === activeControl);
    const toggleList = [
  { key: "db", head: "Database Enabled", sub: "Toggle persistent storage layer" },
  { key: "auth", head: "Authentication Enabled", sub: "Toggle auth system" },
  { key: "rateLimit", head: "Rate Limiting Enabled", sub: "Control request limits" },
  { key: "logging", head: "Logging Enabled", sub: "Enable system logs" },
  { key: "cache", head: "Cache Enabled", sub: "Enable caching layer" },
  { key: "pagination", head: "Pagination Enabled", sub: "Enable pagination system" }
];
    const handleToggle = async (key, value)=>{
       const next = {
        ...toggle, 
        [key]:value
       };
       setToggle(next);
       props.handleToggle(next);
            try{
                const res = await axios.post("http://localhost:5000/api/system",next);
                console.log(res.data.data);
            }
            catch(error){
                console.log("Error", error);
            }
       
    }
    useEffect(()=>{
        const getData = async()=>{
            try{
                const res = await axios.get("http://localhost:5000/api/system");
                const next = res.data.data;
                setToggle(prev =>({
                    ...prev,
                    ...next
                }));
            }
        catch(error){
                console.log("Error", error);
            }
        }
        getData();
        const getControls = async()=>{
            try{
                const res = await axios.get("http://localhost:5000/api/controls");
                if(res.data.success){
                    setControls(res.data.data);
                }
                else{
                    console.log("No contorls data fetched");
                }
            }
            catch(error){
                console.log(error);
            }
        }
        getControls();
    },[]);
    

  return (
    <>
    <div className='SystemControl flex flex-col gap-10'>
        <div className=''>
            <h1 className='text-4xl'>Feature Control Panel</h1>
            <h4 className='text-gray-400'>Toggle Components to observe system behaviour</h4>
        </div>
        <div className='Toggles'>
            <div className='AllToggles'>
                {toggleList.map((item) => (
                    <Toggle
                        key={item.key}
                        headName={item.head}
                        subName={item.sub}
                        toggleName={item.key}
                        value={toggle[item.key]}
                        sendData={handleToggle}
                        onHover={() => setActiveControl(item.key)}
                        onLeave={() => setActiveControl(null)}
                    />
                    ))}
            </div>
            {
                selected && 
                    <div className='ControlInfo'>
                        <div className='ControlTitle'> {selected.title} </div>
                        <div className='ControlDes'> {selected.description}</div>
                        <div className='ControlDetails'> {selected.details} </div>
                    </div>
            }
        </div>
    </div>

    </>
  )
}

export default SystemControl