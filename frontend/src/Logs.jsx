import React, { useEffect, useState } from 'react'
import axios from 'axios'
import API from "./config/api";

const Logs = (props) => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(()=>{
    if (!props.systemToggle.logging) return;

    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API}/api/logs`);
        if(res.data.success === true){
          setLogs(res.data.data);
          setError("");
        }
      } catch (err) {
        console.log(err);
        setError("Unable to read the live log stream.");
      }
    }

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [props.systemToggle.logging]);

  if (!props.systemToggle.logging) return null;

  return (
    <section className='px-4 md:px-10 lg:px-[100px] pb-10' aria-labelledby="live-logs-title">
      <div className='rounded-2xl border border-cyan-500/20 bg-[#01080D] overflow-hidden shadow-[0_0_30px_rgba(0,191,255,0.08)]'>
        <div className='flex items-center justify-between gap-4 border-b border-white/5 px-5 py-4'>
          <div>
            <p className='text-xs uppercase tracking-[0.22em] text-cyan-400 font-mono'>Observability</p>
            <h2 id="live-logs-title" className='text-xl font-semibold'>Live Request Log</h2>
          </div>
          <div className='flex items-center gap-2 text-xs font-mono text-gray-400'>
            <span className='h-2 w-2 rounded-full bg-cyan-400'></span>
            polling every 2s
          </div>
        </div>

        <div className='max-h-72 overflow-auto p-5 font-mono text-sm leading-7 text-gray-400'>
          {error ? (
            <p className='text-red-300'>{error}</p>
          ) : logs.length === 0 ? (
            <p>Waiting for requests... interact with the portfolio to generate activity.</p>
          ) : (
            logs.map((log, index) => (
              <p key={`${log}-${index}`} className='border-b border-white/[0.03] py-1'>
                <span className='text-cyan-500 mr-3'>$</span>{log}
              </p>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default Logs