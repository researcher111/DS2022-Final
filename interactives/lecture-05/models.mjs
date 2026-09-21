// Classroom models with synthetic data. No entered text is executed as JavaScript.
export const MAKERS = Object.freeze([{maker_id:1,maker:'Whitman'},{maker_id:2,maker:'Brackley'},{maker_id:3,maker:'H&D Inc'}].map(Object.freeze));
export const ITEMS = Object.freeze([
  {item_id:12340,item_name:'Sprocket C72',item_qty:73,maker_id:1},
  {item_id:12341,item_name:'Sprocket C72-S',item_qty:14,maker_id:2},
  {item_id:12342,item_name:'Flange 171B',item_qty:161,maker_id:2},
  {item_id:12343,item_name:'Spring Coil B',item_qty:841,maker_id:3}
].map(Object.freeze));
export const STATES = Object.freeze([{state_code:26,home_state:'Michigan',abbreviation:'MI'},{state_code:56,home_state:'Wyoming',abbreviation:'WY'},{state_code:51,home_state:'Virginia',abbreviation:'VA'}].map(Object.freeze));
export const EMPLOYEES = Object.freeze([{employee_id:1,name:'Alice',state_code:26},{employee_id:2,name:'Bob',state_code:56},{employee_id:3,name:'Alice',state_code:56}].map(Object.freeze));
export const JOBS = Object.freeze([{job_code:'J01',job:'Chef'},{job_code:'J02',job:'Waiter'},{job_code:'J03',job:'Bartender'}].map(Object.freeze));
export const ASSIGNMENTS = Object.freeze([{employee_id:1,job_code:'J01'},{employee_id:1,job_code:'J02'},{employee_id:2,job_code:'J02'},{employee_id:2,job_code:'J03'},{employee_id:3,job_code:'J01'}].map(Object.freeze));

function integer(value) {
  if(typeof value!=='number'&&typeof value!=='string')return null;
  if(typeof value==='string'&&!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim()))return null;
  return Number.isSafeInteger(Number(value))?Number(value):null;
}
export function insertItem(items,record,{enforceForeignKey=true}={}) {
  const id=integer(record.item_id),maker=integer(record.maker_id),quantity=integer(record.item_qty);
  const fail=(constraint,message)=>({items,error:message,constraint});
  if(record.item_id===null||record.item_id===undefined||String(record.item_id).trim()==='')return fail('NOT NULL','item_id cannot be NULL or missing.');
  if(id===null||id<1)return fail('CHECK','This schema requires item_id to be a positive integer.');
  if(items.some(item=>item.item_id===id))return fail('PRIMARY KEY',`item_id ${id} already identifies a row.`);
  if(record.item_name===null||record.item_name===undefined)return fail('NOT NULL','item_name cannot be NULL or missing.');
  if(typeof record.item_name!=='string'||!record.item_name.trim())return fail('CHECK','This schema requires a nonblank item_name.');
  if(quantity===null||quantity<0)return fail('CHECK','item_qty must be a nonnegative integer.');
  if(maker===null)return fail('NOT NULL','This schema requires a maker_id.');
  if(enforceForeignKey&&!MAKERS.some(row=>row.maker_id===maker))return fail('FOREIGN KEY',`maker_id ${maker} has no matching Makers row.`);
  return {items:[...items,{item_id:id,item_name:record.item_name.trim(),item_qty:quantity,maker_id:maker}],error:null,constraint:null};
}
export function joinItems(items,type='inner') {
  if(!['inner','left'].includes(type))throw new RangeError('Join type must be inner or left.');
  return items.flatMap(item=>{const maker=MAKERS.find(row=>row.maker_id===item.maker_id);return maker||type==='left'?[{...item,maker:maker?.maker??null}]:[];});
}

function table(name,columns,rows,key){return {name,columns,rows,key};}
export function normalizationView(form=1,update='none',stateCode=51) {
  if(![0,1,2,3].includes(form)||!['none','first','all'].includes(update))throw new RangeError('Unknown normalization step or update mode.');
  const destination=STATES.find(row=>row.state_code===Number(stateCode));
  if(!destination)throw new RangeError('Unknown state.');
  const employees=EMPLOYEES.map(row=>({...row}));
  const joined=ASSIGNMENTS.map(assignment=>{
    const employee=employees.find(row=>row.employee_id===assignment.employee_id),job=JOBS.find(row=>row.job_code===assignment.job_code),state=STATES.find(row=>row.state_code===employee.state_code);
    return {...employee,job_code:job.job_code,job:job.job,home_state:state.home_state};
  });
  let affected=0;
  if(form===1&&update!=='none'){
    for(const row of joined)if(row.employee_id===1&&(update==='all'||affected===0)){row.state_code=destination.state_code;row.home_state=destination.home_state;affected+=1;}
  }else if(update!=='none'){
    employees[0].state_code=destination.state_code;affected=1;
    for(const row of joined)if(row.employee_id===1){row.state_code=destination.state_code;row.home_state=destination.home_state;}
  }
  const rows=(records,columns)=>records.map(record=>columns.map(column=>record[column]));
  const full=['employee_id','name','job_code','job','state_code','home_state'];
  let tables;
  if(form===0){
    const raw=employees.map(employee=>{const matches=joined.filter(row=>row.employee_id===employee.employee_id);return {...matches[0],job_code:matches.map(row=>row.job_code).join(', '),job:matches.map(row=>row.job).join(', ')};});
    tables=[table('Unnormalized restaurant sheet',full,rows(raw,full),'employee_id')];
  }else if(form===1)tables=[table('Employee jobs — 1NF',full,rows(joined,full),'(employee_id, job_code)')];
  else {
    const columns=form===2?['employee_id','name','state_code','home_state']:['employee_id','name','state_code'];
    const expanded=employees.map(employee=>({...employee,home_state:STATES.find(row=>row.state_code===employee.state_code).home_state}));
    tables=[table('Employees',columns,rows(expanded,columns),'employee_id'),table('Employee_jobs',['employee_id','job_code'],rows(ASSIGNMENTS,['employee_id','job_code']),'(employee_id, job_code)'),table('Jobs',['job_code','job'],rows(JOBS,['job_code','job']),'job_code')];
    if(form===3)tables.push(table('States',['state_code','home_state'],rows(STATES.filter(state=>state.state_code!==51||employees.some(employee=>employee.state_code===51)),['state_code','home_state']),'state_code'));
  }
  return {form,tables,joined,affected,anomaly:new Set(joined.filter(row=>row.employee_id===1).map(row=>row.state_code)).size>1};
}

export function parseCents(value) {
  if(!/^\d+(?:\.\d{1,2})?$/.test(String(value).trim()))return null;
  const [dollars,cents='']=String(value).trim().split('.');
  const result=Number(dollars)*100+Number(cents.padEnd(2,'0'));
  return Number.isSafeInteger(result)&&result>0?result:null;
}
export function createTransfer() {return {committed:{checking:10000,savings:4000},working:null,phase:'idle',amount:0,failCredit:false,log:[],commits:0,error:null};}
export function transferAction(state,action,{amount=2500,failCredit=false}={}) {
  const log=message=>[...state.log,message];
  const abort=message=>({...state,working:null,phase:'rolledback',error:message,log:log(`${message} Application issues ROLLBACK; committed balances stay unchanged.`)});
  if(action==='begin'){
    if(state.working)return {...state,error:'Finish or roll back the current transaction first.'};
    if(!Number.isSafeInteger(amount)||amount<=0)return {...state,error:'Enter a positive amount with at most two decimal places.'};
    return {...state,working:{...state.committed},phase:'begun',amount,failCredit,error:null,log:log('BEGIN: create a private working view.')};
  }
  if(action==='debit'){
    if(state.phase!=='begun')return {...state,error:'Begin a transaction before the debit.'};
    if(state.working.checking<state.amount)return abort('CHECK balance >= 0 failed on the debit.');
    return {...state,working:{...state.working,checking:state.working.checking-state.amount},phase:'debited',error:null,log:log('Debit checking in this transaction. Other readers still see committed balances.')};
  }
  if(action==='credit'){
    if(state.phase!=='debited')return {...state,error:'Apply the debit before the credit.'};
    if(state.failCredit)return abort('The simulated destination-account constraint failed before the credit.');
    const balance=state.working.savings+state.amount;
    if(!Number.isSafeInteger(balance))return abort('The credit exceeds the model’s exact integer range.');
    return {...state,working:{...state.working,savings:balance},phase:'credited',error:null,log:log('Credit savings in the same transaction. Both changes are ready to commit.')};
  }
  if(action==='commit'){
    if(state.phase!=='credited')return {...state,error:'Both transfer updates must succeed before committing.'};
    if(state.working.checking+state.working.savings!==state.committed.checking+state.committed.savings)return abort('Transfer total check failed.');
    return {...state,committed:{...state.working},working:null,phase:'committed',commits:state.commits+1,error:null,log:log('COMMIT: both new balances become the committed state.')};
  }
  if(action==='rollback'){
    if(!state.working)return {...state,error:'There is no active transaction to roll back.'};
    return {...state,working:null,phase:'rolledback',error:null,log:log('ROLLBACK: discard every uncommitted change.')};
  }
  if(action==='reconnect')return {...state,working:null,phase:'idle',error:null,log:log('Model reconnect: retain committed balances; discard any pending transaction.')};
  throw new RangeError('Unknown transaction action.');
}

export const ETL_SAMPLE=JSON.stringify([
  {employee_id:'4',name:'  Dana  ',state:'mi'},
  {employee_id:5,name:"O'Neil",state:'WY'},
  {employee_id:4,name:'Dana duplicate',state:'MI'},
  {employee_id:6,name:'',state:'VA'},
  {employee_id:'oops',name:'Eli',state:'WY'},
  {employee_id:7,name:'Finn',state:'ZZ'}
],null,2);
export function transformEmployees(raw,{trimNames=true,normalizeStates=true,duplicates='skip'}={}) {
  let source;
  try {source=JSON.parse(raw);}catch(error){return {source:[],accepted:[],rejected:[],error:`Invalid JSON: ${error.message}`};}
  if(!Array.isArray(source))return {source:[],accepted:[],rejected:[],error:'The input must be a JSON array of employee objects.'};
  if(source.length>500)return {source:[],accepted:[],rejected:[],error:'This classroom model accepts at most 500 records.'};
  if(!['skip','reject'].includes(duplicates))throw new RangeError('Unknown duplicate policy.');
  const accepted=[],rejected=[],seen=new Set();let error=null;
  source.forEach((record,index)=>{
    const reject=reason=>rejected.push({row:index+1,reason,record});
    if(!record||typeof record!=='object'||Array.isArray(record))return reject('Expected an employee object.');
    const id=integer(record.employee_id);
    if(id===null||id<=0)return reject('employee_id must be a positive integer.');
    if(typeof record.name!=='string'||record.name.trim()==='')return reject('name must be nonblank text.');
    let key=record.state;
    if(normalizeStates&&typeof key==='string'){key=key.trim().toUpperCase();const code=integer(key);if(code!==null)key=code;}
    const state=STATES.find(state=>state.abbreviation===key||state.state_code===key);
    if(!state)return reject('state must match MI, WY, VA or their numeric state code.');
    if(seen.has(id)){
      if(duplicates==='reject')error='Duplicate employee IDs block this batch. Fix the source or choose keep first valid ID.';
      return reject(`Duplicate employee_id ${id}; first valid record retained.`);
    }
    seen.add(id);accepted.push({employee_id:id,name:trimNames?record.name.trim():record.name,state_code:state.state_code});
  });
  return {source,accepted,rejected,error};
}
