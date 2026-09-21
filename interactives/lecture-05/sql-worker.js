/* SQL runs off the UI thread. Local dependencies only. */
importScripts('./vendor/sql-wasm.js');
let database=null,mode='queries';
const runtime=Promise.all([initSqlJs({locateFile:file=>new URL('./vendor/'+file,self.location.href).href}),import('./sql-core.mjs')]);
let queue=Promise.resolve();
self.onmessage=event=>{
  queue=queue.then(async()=>{
    const {id,action,sql,records,mode:requestedMode}=event.data;
    try {
      const [SQL,core]=await runtime;
      if(action==='init'||action==='reset'){
        if(database)database.close();
        mode=requestedMode??mode;
        database=mode==='etl'?core.createETLDatabase(SQL):core.createSeededDatabase(SQL);
      }
      if(!database)throw new Error('Database is not initialized. Reset data and try again.');
      let result={};
      if(action==='run')result=core.executeSQL(database,sql);
      if(action==='load')result=core.loadEmployeeBatch(database,records);
      const schema=core.inspectDatabase(database);
      self.postMessage({id,ok:true,result,schema,imported:mode==='etl'?core.importedEmployees(database):null});
    }catch(error){self.postMessage({id,ok:false,error:error.message});}
  });
};
