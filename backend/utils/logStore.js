const logs = [];

export const addLogs = (log)=>{
    logs.unshift(log);
    if(logs.length >50){
        logs.pop();
    }
}

export const getLogs = ()=>{
    return  logs;
}