import React, { useEffect, useState } from 'react'
import Toggle from './reusable/Toggle'
const SystemControl = (props) => {
    const [toggle,  setToggle] = useState(()=>{
        const stored = localStorage.getItem("toggle");
        return stored ? JSON.parse(stored) : {
            auth:false,
            db:false,
            cache: false,
            logging: false,
            rateLimit: false,
            pagination: false
        };
    });
    const handleToggle = (key, value)=>{
       const next = {
        ...toggle, 
        [key]:value
       };
       setToggle(next);
        props.handleToggle(next);
    }
    useEffect(()=>{
        localStorage.setItem("toggle", JSON.stringify(toggle));
    },[toggle]);
  

  return (
    <>
    <div className='SystemControl flex flex-col gap-10'>
        <div className=''>
            <h1 className='text-4xl'>Feature Control Panel</h1>
            <h4 className='text-gray-400'>Toggle Components to observe system behaviour</h4>
        </div>
        <div className='Toggles'>
            <div className='AllToggles'>
            <Toggle headName="Database Enabled" subName="Toggle persistent storage layer" toggleName="db" value={toggle.db} className="MainToggle" sendData={handleToggle}></Toggle>
            <Toggle headName="Authentication Enabled" subName="Toggle persistent storage layer" toggleName="auth" value={toggle.auth} className="MainToggle" sendData={handleToggle}></Toggle>
            <Toggle headName="Rate Limiting Enabled" subName="Toggle persistent storage layer" toggleName="rateLimit" value={toggle.rateLimit} className="MainToggle" sendData={handleToggle}></Toggle>
            <Toggle headName="Logging Enabled" subName="Toggle persistent storage layer" toggleName="logging" value={toggle.logging} className="MainToggle" sendData={handleToggle}></Toggle>
            <Toggle headName="Cache Enabled" subName="Toggle persistent storage layer" toggleName="cache" value={toggle.cache} className="MainToggle" sendData={handleToggle}></Toggle>
            <Toggle headName="Pagination Enabled" subName="Toggle persistent storage layer" toggleName="pagination" value={toggle.pagination} className="MainToggle" sendData={handleToggle}></Toggle>
            </div>
            <div>
                Info
            </div>
        </div>
    </div>

    </>
  )
}

export default SystemControl