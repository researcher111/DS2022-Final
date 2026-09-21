import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS,insertItem,joinItems,normalizationView,parseCents,createTransfer,transferAction,ETL_SAMPLE,transformEmployees} from './models.mjs';

test('item primary, required, check, and foreign-key constraints have distinct outcomes',()=>{
 const row={item_id:12344,item_name:'Gear',item_qty:5,maker_id:2};
 assert.equal(insertItem(ITEMS,row).items.length,5);
 assert.equal(insertItem(ITEMS,{...row,item_id:12340}).constraint,'PRIMARY KEY');
 assert.equal(insertItem(ITEMS,{...row,item_id:null}).constraint,'NOT NULL');
 assert.equal(insertItem(ITEMS,{...row,item_id:-1}).constraint,'CHECK');
 assert.equal(insertItem(ITEMS,{...row,item_name:' '}).constraint,'CHECK');
 assert.equal(insertItem(ITEMS,{...row,item_name:null}).constraint,'NOT NULL');
 assert.equal(insertItem(ITEMS,{...row,item_qty:-1}).constraint,'CHECK');
 const rejected=insertItem(ITEMS,{...row,maker_id:99});
 assert.equal(rejected.constraint,'FOREIGN KEY');assert.strictEqual(rejected.items,ITEMS);
});
test('an orphan appears in a left join with NULL and disappears in an inner join',()=>{
 const inserted=insertItem(ITEMS,{item_id:12344,item_name:'Orphan',item_qty:1,maker_id:99},{enforceForeignKey:false});
 assert.equal(inserted.error,null);
 assert.equal(joinItems(inserted.items,'inner').length,4);
 const left=joinItems(inserted.items,'left');assert.equal(left.length,5);assert.equal(left.at(-1).maker,null);
 assert.equal(joinItems(ITEMS).filter(row=>row.maker==='Brackley').length,2);
});
test('normalization preserves five assignments and distinguishes the two Alices',()=>{
 for(const form of [0,1,2,3]){
  const view=normalizationView(form);assert.equal(view.joined.length,5);
  assert.equal(view.joined.filter(row=>row.employee_id===1).length,2);
  assert.equal(view.joined.find(row=>row.employee_id===3).home_state,'Wyoming');
 }
 assert.equal(normalizationView(0).tables[0].rows[0][3],'Chef, Waiter');
 assert.equal(normalizationView(1).tables[0].key,'(employee_id, job_code)');
 assert.equal(normalizationView(2).tables.length,3);
 assert.equal(normalizationView(3).tables.length,4);
});
test('a missed 1NF update creates an anomaly while normalized design updates one employee fact',()=>{
 const partial=normalizationView(1,'first',51);assert.equal(partial.affected,1);assert.equal(partial.anomaly,true);
 assert.deepEqual(partial.joined.filter(row=>row.employee_id===1).map(row=>row.state_code),[51,26]);
 const all=normalizationView(1,'all',51);assert.equal(all.affected,2);assert.equal(all.anomaly,false);
 const normalized=normalizationView(3,'first',51);assert.equal(normalized.affected,1);assert.equal(normalized.anomaly,false);
 assert.deepEqual(normalized.joined.filter(row=>row.employee_id===1).map(row=>row.state_code),[51,51]);
 assert.equal(normalized.joined.find(row=>row.employee_id===3).state_code,56);
 assert.equal(normalizationView(3).joined[0].state_code,26);
});
test('amounts are positive integer cents with no rounding of extra decimal places',()=>{
 assert.equal(parseCents('25.01'),2501);assert.equal(parseCents('0.1'),10);assert.equal(parseCents('0.01'),1);
 for(const bad of ['0','-1','1.001','1e2','NaN',''])assert.equal(parseCents(bad),null);
});
test('commit publishes both transfer changes and reconnect retains the committed state',()=>{
 const original=createTransfer();let state=transferAction(original,'begin',{amount:2501});
 state=transferAction(state,'debit');assert.deepEqual(state.committed,{checking:10000,savings:4000});assert.equal(state.working.checking,7499);
 state=transferAction(state,'credit');assert.equal(state.working.savings,6501);
 state=transferAction(state,'commit');assert.deepEqual(state.committed,{checking:7499,savings:6501});assert.equal(state.working,null);
 assert.equal(state.committed.checking+state.committed.savings,14000);
 state=transferAction(state,'reconnect');assert.deepEqual(state.committed,{checking:7499,savings:6501});
 assert.deepEqual(original,createTransfer());
});
test('failed credit and insufficient funds explicitly roll back with no partial committed balances',()=>{
 let state=transferAction(createTransfer(),'begin',{amount:2500,failCredit:true});
 state=transferAction(state,'debit');assert.equal(state.working.checking,7500);
 state=transferAction(state,'credit');assert.equal(state.phase,'rolledback');assert.equal(state.working,null);
 assert.deepEqual(state.committed,{checking:10000,savings:4000});assert.match(state.error,/constraint/);
 state=transferAction(createTransfer(),'begin',{amount:10001});state=transferAction(state,'debit');
 assert.equal(state.phase,'rolledback');assert.deepEqual(state.committed,{checking:10000,savings:4000});
});
test('manual rollback, reconnect during pending work, and invalid step ordering cannot publish a debit',()=>{
 const begun=transferAction(createTransfer(),'begin',{amount:3000});
 assert.match(transferAction(begun,'commit').error,/Both/);
 const debited=transferAction(begun,'debit');
 for(const action of ['rollback','reconnect']){
  const done=transferAction(debited,action);assert.deepEqual(done.committed,{checking:10000,savings:4000});assert.equal(done.working,null);
 }
 assert.match(transferAction(begun,'begin').error,/current transaction/);
});
test('ETL sample cleans two records and reports each invalid or duplicate source row',()=>{
 const result=transformEmployees(ETL_SAMPLE);
 assert.equal(result.error,null);assert.equal(result.source.length,6);assert.equal(result.accepted.length,2);assert.equal(result.rejected.length,4);
 assert.deepEqual(result.accepted,[{employee_id:4,name:'Dana',state_code:26},{employee_id:5,name:"O'Neil",state_code:56}]);
 assert.match(transformEmployees(ETL_SAMPLE,{duplicates:'reject'}).error,/Duplicate/);
});
test('ETL keeps first valid ID, normalizes state codes, and treats SQL-looking names as literal data',()=>{
 const input=JSON.stringify([{employee_id:9,name:' ',state:'VA'},{employee_id:'9',name:"  x'); DROP TABLE employees; --  ",state:'51'},{employee_id:9,name:'Late duplicate',state:26}]);
 const result=transformEmployees(input);assert.equal(result.accepted.length,1);assert.equal(result.rejected.length,2);
 assert.deepEqual(result.accepted[0],{employee_id:9,name:"x'); DROP TABLE employees; --",state_code:51});
 assert.equal(transformEmployees(JSON.stringify([{employee_id:4,name:' Dana ',state:'mi'}]),{normalizeStates:false}).accepted.length,0);
 assert.equal(transformEmployees(JSON.stringify([{employee_id:4,name:' Dana ',state:'MI'}]),{trimNames:false}).accepted[0].name,' Dana ');
 assert.match(transformEmployees('not JSON').error,/Invalid JSON/);
 assert.match(transformEmployees('{}').error,/array/);
});
