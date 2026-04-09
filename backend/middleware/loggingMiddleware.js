import {performance} from 'node:perf_hooks';
import { addLogs } from '../utils/logStore.js';

const loggingMiddleware = (req, res, next) =>{
    if(req.systemConfig?.logging === true){
        const  start = performance.now();
        const logging = ()=>{
            let logs = "";
            const end = performance.now();
            const timeTaken = end - start;
            logs = `[LOG] ${req.method} ${req.originalUrl} | ${res.statusCode} | ${Math.round(timeTaken)}ms | ${req.ip}`;            
            res.logs = logs;
            addLogs(logs);
            console.log(logs);
        }
        res.on("finish", logging);
    }
    else{
        console.log("logging middleware not working");
    }
    next();
}

export default loggingMiddleware;