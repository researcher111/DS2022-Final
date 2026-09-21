export function createSQLClient(mode,onTimeout=()=>{}) {
  let worker=null,sequence=0;
  const pending=new Map();
  function stop(message){
    worker?.terminate();worker=null;
    for(const call of pending.values()){clearTimeout(call.timer);call.reject(new Error(message));}
    pending.clear();
  }
  function start(){
    worker=new Worker(new URL('./sql-worker.js',import.meta.url));
    worker.onmessage=({data})=>{
      const call=pending.get(data.id);if(!call)return;
      pending.delete(data.id);clearTimeout(call.timer);
      data.ok?call.resolve(data):call.reject(new Error(data.error));
    };
    worker.onerror=event=>{stop(event.message||'Could not load the local SQLite worker.');onTimeout();};
  }
  function request(action,payload={}){
    if(!worker)start();
    const id=++sequence;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{stop('Query stopped after 8 seconds. Reset data to start a fresh database.');onTimeout();},8000);
      pending.set(id,{resolve,reject,timer});worker.postMessage({id,action,mode,...payload});
    });
  }
  return {request,cancel(){stop('Execution cancelled. Reset data to start a fresh database.');onTimeout();},close(){stop('Activity closed.');}};
}
