import React, { useEffect, useMemo, useState } from 'react'
import Toggle from './reusable/Toggle'
import API from "./config/api";
import axios from 'axios';

const SystemControl = (props) => {
    const [toggle, setToggle] = useState({
        auth: false,
        db: false,
        cache: false,
        logging: false,
        rateLimit: false,
        pagination: false
    });
    const [activeControl, setActiveControl] = useState("db");
    const [controls, setControls] = useState([]);
    const [syncState, setSyncState] = useState("Connecting...");

    const toggleList = [
        { key: "db", head: "Database", sub: "Switch between persistent and non-persistent project data" },
        { key: "auth", head: "Authentication", sub: "Require JWT-backed access for protected behavior" },
        { key: "rateLimit", head: "Rate Limiting", sub: "Enable request throttling at the API layer" },
        { key: "logging", head: "Request Logging", sub: "Expose live request activity from the backend" },
        { key: "cache", head: "Caching", sub: "Serve eligible responses through the cache layer" },
        { key: "pagination", head: "Pagination", sub: "Return project data through paginated responses" }
    ];

    const selected = controls.find(c => c.key === activeControl);
    const enabledCount = useMemo(() => Object.values(toggle).filter(Boolean).length, [toggle]);

    const handleToggle = async (key, value) => {
        const previous = toggle;
        const next = { ...toggle, [key]: value };
        setToggle(next);
        props.handleToggle(next);
        setSyncState("Applying configuration...");

        try {
            const res = await axios.post(`${API}/api/system`, next);
            const synced = res.data?.data || next;
            setToggle(prev => ({ ...prev, ...synced }));
            props.handleToggle({ ...next, ...synced });
            setSyncState("Backend synced ✓");
        }
        catch (error) {
            console.log("Error", error);
            setToggle(previous);
            props.handleToggle(previous);
            setSyncState("Sync failed — change reverted");
        }
    }

    useEffect(() => {
        const getData = async () => {
            try {
                const res = await axios.get(`${API}/api/system`);
                const next = res.data.data;
                setToggle(prev => {
                    const merged = { ...prev, ...next };
                    props.handleToggle(merged);
                    return merged;
                });
                setSyncState("Backend synced ✓");
            }
            catch (error) {
                console.log("Error", error);
                setSyncState("Backend unavailable");
            }
        }

        const getControls = async () => {
            try {
                const res = await axios.get(`${API}/api/controls`);
                if (res.data.success) {
                    setControls(res.data.data);
                } else {
                    console.log("No controls data fetched");
                }
            }
            catch (error) {
                console.log(error);
            }
        }

        getData();
        getControls();
    }, []);

    return (
        <section className='SystemControl flex flex-col gap-10' aria-labelledby="backend-lab-title">
            <div className='flex flex-col gap-4'>
                <p className='text-sm uppercase tracking-[0.28em] text-cyan-400 font-mono'>Live architecture demo</p>
                <div className='flex flex-wrap items-end justify-between gap-5'>
                    <div>
                        <h2 id="backend-lab-title" className='text-4xl font-bold'>Backend Feature Control Panel</h2>
                        <p className='text-gray-400 mt-2 max-w-3xl'>
                            These controls change the running backend configuration. Toggle a feature, then interact with the site and observe the resulting behavior.
                        </p>
                    </div>
                    <div className='rounded-xl border border-cyan-500/20 bg-black/20 px-4 py-3 font-mono text-sm'>
                        <div className='text-gray-500'>runtime state</div>
                        <div className='text-cyan-400'>{enabledCount}/6 features enabled</div>
                        <div className='text-gray-400'>{syncState}</div>
                    </div>
                </div>
            </div>

            <div className='Toggles'>
                <div className='AllToggles'>
                    {toggleList.map((item) => (
                        <div key={item.key} onClick={() => setActiveControl(item.key)}>
                            <Toggle
                                headName={`${item.head} ${toggle[item.key] ? "ON" : "OFF"}`}
                                subName={item.sub}
                                toggleName={item.key}
                                value={toggle[item.key]}
                                sendData={handleToggle}
                                onHover={() => setActiveControl(item.key)}
                                onLeave={() => {}}
                            />
                        </div>
                    ))}
                </div>

                <aside className='ControlInfo min-h-[220px]'>
                    <div className='text-xs uppercase tracking-[0.22em] text-gray-500 font-mono'>Architecture inspector</div>
                    <div className='ControlTitle'>{selected?.title || toggleList.find(item => item.key === activeControl)?.head}</div>
                    <div className='ControlDes'>
                        {selected?.description || toggleList.find(item => item.key === activeControl)?.sub}
                    </div>
                    {selected?.details && <div className='ControlDetails'>{selected.details}</div>}
                    <div className='mt-auto pt-4 border-t border-white/5 font-mono text-sm'>
                        <span className='text-gray-500'>current state: </span>
                        <span className={toggle[activeControl] ? 'text-cyan-400' : 'text-gray-400'}>
                            {toggle[activeControl] ? 'ENABLED' : 'DISABLED'}
                        </span>
                    </div>
                </aside>
            </div>
        </section>
    )
}
export default SystemControl