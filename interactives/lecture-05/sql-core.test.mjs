import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {createSeededDatabase,executeSQL,inspectDatabase,createETLDatabase,loadEmployeeBatch,importedEmployees,QUERY_EXAMPLES} from './sql-core.mjs';
const require=createRequire(import.meta.url);
const initSqlJs=require('./vendor/sql-wasm.js');
const SQL=await initSqlJs({wasmBinary:readFileSync(new URL('./vendor/sql-wasm.wasm',import.meta.url))});
const values=(db,sql)=>db.exec(sql)[0]?.values??[];

test('vendored SQLite executes every supplied example with the intended orphan error',()=>{
 for(const example of QUERY_EXAMPLES){
  const db=createSeededDatabase(SQL);
  try{const result=executeSQL(db,example.sql);if(example.id==='fk')assert.match(result.error,/FOREIGN KEY/);else assert.equal(result.error,null,example.id);}
  finally{db.close();}
 }
});
test('real joins, WHERE precedence, stable ordering and LIMIT return the source restaurant rows',()=>{
 const db=createSeededDatabase(SQL);
 try{
  const joined=executeSQL(db,QUERY_EXAMPLES.find(example=>example.id==='join').sql);
  assert.equal(joined.results[0].values.length,5);
  assert.deepEqual(joined.results[0].values[0],[1,'Alice','Chef','Michigan']);
  assert.deepEqual(joined.results[0].values.at(-1),[3,'Alice','Chef','Wyoming']);
  assert.deepEqual(executeSQL(db,QUERY_EXAMPLES.find(example=>example.id==='filter').sql).results[0].values,[[2,'Bob',56],[3,'Alice',56]]);
  assert.deepEqual(executeSQL(db,QUERY_EXAMPLES.find(example=>example.id==='sort').sql).results[0].values.map(row=>row[0]),[12343,12342]);
 }finally{db.close();}
});
test('the engine performs CRUD and reports syntax or schema errors rather than parsing SQL with regex',()=>{
 const db=createSeededDatabase(SQL);
 try{
  assert.equal(executeSQL(db,"INSERT INTO employees VALUES(4,'Dana',51); UPDATE employees SET name='Dee' WHERE employee_id=4;").error,null);
  assert.deepEqual(values(db,'SELECT name FROM employees WHERE employee_id=4;'),[['Dee']]);
  assert.equal(executeSQL(db,'DELETE FROM employees WHERE employee_id=4;').results[0].changes,1);
  assert.deepEqual(values(db,'SELECT * FROM employees WHERE employee_id=4;'),[]);
  assert.match(executeSQL(db,'SELEC name FROM employees;').error,/syntax/);
  assert.match(executeSQL(db,'USE restaurant;').error,/syntax/);
  assert.deepEqual(values(db,"SELECT NULL IS NULL, NULL = NULL, 'O''Neil';"),[[1,null,"O'Neil"]]);
 }finally{db.close();}
});
test('foreign keys and NOT NULL / CHECK constraints are actually enforced in seeded SQL',()=>{
 const db=createSeededDatabase(SQL);
 try{
  assert.equal(inspectDatabase(db).foreignKeys,true);
  for(const [sql,pattern] of [
   ["INSERT INTO employees VALUES(8,'Unknown',99);",/FOREIGN KEY/],
   ["INSERT INTO employees VALUES(NULL,'No ID',26);",/NOT NULL/],
   ["INSERT INTO employees VALUES(1,'Duplicate',26);",/UNIQUE/],
   ["INSERT INTO items VALUES(12344,' ',5,1);",/CHECK/],
   ["INSERT INTO items VALUES(-1,'Gear',5,1);",/CHECK/],
   ["DELETE FROM employees WHERE employee_id=1;",/FOREIGN KEY/]
  ])assert.match(executeSQL(db,sql).error,pattern);
  assert.equal(values(db,'SELECT COUNT(*) FROM employees;')[0][0],3);
 }finally{db.close();}
});
test('truncated RETURNING finalizes the write and reports every changed row',()=>{
 const db=createSeededDatabase(SQL);
 try{
  const result=executeSQL(db,"UPDATE employees SET name=name||'!' RETURNING employee_id,name; SELECT COUNT(*) FROM employees;",{maxRows:1});
  assert.equal(result.error,null);assert.equal(result.results[0].values.length,1);assert.equal(result.results[0].truncated,true);assert.equal(result.results[0].changes,3);
  assert.deepEqual(values(db,'SELECT name FROM employees ORDER BY employee_id;'),[['Alice!'],['Bob!'],['Alice!']]);
  assert.equal(result.results[1].values[0][0],3);
 }finally{db.close();}
});
test('failed statements and statement caps leave the database usable, and transactions roll back changes',()=>{
 const db=createSeededDatabase(SQL);
 try{
  for(let i=0;i<5;i++)assert.match(executeSQL(db,"INSERT INTO employees VALUES(9,'Orphan',99);").error,/FOREIGN KEY/);
  const capped=executeSQL(db,'SELECT 1; SELECT 2; SELECT 3;',{maxStatements:1});assert.match(capped.error,/Stopped after 1/);assert.equal(capped.results.length,1);
  assert.equal(executeSQL(db,'BEGIN; UPDATE employees SET state_code=51 WHERE employee_id=1; ROLLBACK;').error,null);
  assert.deepEqual(values(db,'SELECT state_code FROM employees WHERE employee_id=1;'),[[26]]);
  const exported=db.export();assert.ok(exported.length>0);
 }finally{db.close();}
});
test('bound ETL inserts preserve apostrophes and SQL-looking text literally',()=>{
 const db=createETLDatabase(SQL);
 try{
  const name="O'Neil'); DROP TABLE imported_employees; --";
  assert.deepEqual(loadEmployeeBatch(db,[{employee_id:4,name,state_code:26}]),{loaded:1,error:null});
  assert.deepEqual(importedEmployees(db).values,[[4,name,26]]);
  assert.equal(values(db,"SELECT COUNT(*) FROM sqlite_schema WHERE name='imported_employees';")[0][0],1);
 }finally{db.close();}
});
test('an existing ID or FK violation rolls back the full accepted ETL batch',()=>{
 const db=createETLDatabase(SQL);
 try{
  loadEmployeeBatch(db,[{employee_id:4,name:'Dana',state_code:26}]);
  const duplicate=loadEmployeeBatch(db,[{employee_id:5,name:'Eli',state_code:56},{employee_id:4,name:'Duplicate',state_code:26}]);
  assert.equal(duplicate.loaded,0);assert.match(duplicate.error,/UNIQUE/);
  assert.deepEqual(importedEmployees(db).values,[[4,'Dana',26]]);
  const invalid=loadEmployeeBatch(db,[{employee_id:6,name:'Finn',state_code:51},{employee_id:7,name:'Invalid',state_code:99}]);
  assert.equal(invalid.loaded,0);assert.match(invalid.error,/FOREIGN KEY/);
  assert.deepEqual(importedEmployees(db).values,[[4,'Dana',26]]);
 }finally{db.close();}
});
