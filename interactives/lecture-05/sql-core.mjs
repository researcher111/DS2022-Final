// Database operations shared by the browser worker and real-engine Node tests.
export const SEED_SQL = `
PRAGMA foreign_keys = ON;
CREATE TABLE states (state_code INT NOT NULL PRIMARY KEY, home_state TEXT NOT NULL);
CREATE TABLE employees (
  employee_id INT NOT NULL PRIMARY KEY CHECK (typeof(employee_id) = 'integer' AND employee_id > 0),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  state_code INT NOT NULL REFERENCES states(state_code)
);
CREATE TABLE jobs (job_code TEXT NOT NULL PRIMARY KEY, job TEXT NOT NULL);
CREATE TABLE employee_jobs (
  employee_id INT NOT NULL REFERENCES employees(employee_id),
  job_code TEXT NOT NULL REFERENCES jobs(job_code),
  PRIMARY KEY (employee_id, job_code)
);
CREATE TABLE makers (maker_id INT NOT NULL PRIMARY KEY, maker TEXT NOT NULL);
CREATE TABLE items (
  item_id INT NOT NULL PRIMARY KEY CHECK (typeof(item_id)='integer' AND item_id>0),
  item_name TEXT NOT NULL CHECK (length(trim(item_name))>0),
  item_qty INT NOT NULL CHECK (typeof(item_qty)='integer' AND item_qty >= 0),
  maker_id INT NOT NULL REFERENCES makers(maker_id)
);
INSERT INTO states VALUES (26, 'Michigan'), (56, 'Wyoming'), (51, 'Virginia');
INSERT INTO employees VALUES (1, 'Alice', 26), (2, 'Bob', 56), (3, 'Alice', 56);
INSERT INTO jobs VALUES ('J01', 'Chef'), ('J02', 'Waiter'), ('J03', 'Bartender');
INSERT INTO employee_jobs VALUES (1,'J01'), (1,'J02'), (2,'J02'), (2,'J03'), (3,'J01');
INSERT INTO makers VALUES (1,'Whitman'), (2,'Brackley'), (3,'H&D Inc');
INSERT INTO items VALUES (12340,'Sprocket C72',73,1), (12341,'Sprocket C72-S',14,2), (12342,'Flange 171B',161,2), (12343,'Spring Coil B',841,3);
`;
export const QUERY_EXAMPLES = Object.freeze([
  {id:'select',label:'Read · SELECT',sql:'SELECT employee_id, name, state_code\nFROM employees\nORDER BY employee_id;'},
  {id:'filter',label:'Filter · WHERE / AND / OR',sql:"SELECT employee_id, name, state_code\nFROM employees\nWHERE (name = 'Alice' OR name = 'Bob')\n  AND state_code = 56\nORDER BY employee_id;"},
  {id:'sort',label:'Sort · ORDER BY / LIMIT',sql:'SELECT item_id, item_name, item_qty\nFROM items\nORDER BY item_qty DESC, item_id\nLIMIT 2;'},
  {id:'join',label:'Relate · JOIN',sql:'SELECT e.employee_id, e.name, j.job, s.home_state\nFROM employees AS e\nJOIN employee_jobs AS ej ON ej.employee_id = e.employee_id\nJOIN jobs AS j ON j.job_code = ej.job_code\nJOIN states AS s ON s.state_code = e.state_code\nORDER BY e.employee_id, j.job_code;'},
  {id:'insert',label:'Create row · INSERT',sql:"INSERT INTO employees (employee_id, name, state_code)\nVALUES (4, 'Dana', 51);\nSELECT * FROM employees ORDER BY employee_id;"},
  {id:'update',label:'Change · UPDATE',sql:'UPDATE employees\nSET state_code = 51\nWHERE employee_id = 1;\nSELECT * FROM employees ORDER BY employee_id;'},
  {id:'delete',label:'Remove · DELETE',sql:'-- Remove the child rows before the referenced employee.\nBEGIN;\nDELETE FROM employee_jobs WHERE employee_id = 2;\nDELETE FROM employees WHERE employee_id = 2;\nCOMMIT;\nSELECT * FROM employees ORDER BY employee_id;'},
  {id:'create',label:'Create table · CREATE TABLE',sql:'CREATE TABLE IF NOT EXISTS notes (\n  note_id INT NOT NULL PRIMARY KEY,\n  message TEXT NOT NULL\n);\nSELECT name, sql FROM sqlite_schema\nWHERE name = \'notes\';'},
  {id:'null',label:'Missing values · NULL',sql:"SELECT NULL IS NULL AS is_missing,\n       NULL = NULL AS equality_is_unknown,\n       COALESCE(NULL, 'fallback') AS replaced;"},
  {id:'fk',label:'Constraint · orphan rejected',sql:"INSERT INTO employees (employee_id, name, state_code)\nVALUES (9, 'Eli', 99);"},
  {id:'rollback',label:'Transaction · ROLLBACK',sql:'BEGIN;\nUPDATE employees SET state_code = 51 WHERE employee_id = 1;\nSELECT * FROM employees ORDER BY employee_id;\nROLLBACK;\nSELECT * FROM employees ORDER BY employee_id;'}
]);
export function createSeededDatabase(SQL) {const db=new SQL.Database();db.run(SEED_SQL);return db;}
const quoteIdentifier=name=>'"'+String(name).replace(/"/g,'""')+'"';
function safeValue(value){return value instanceof Uint8Array?`[BLOB: ${value.length} bytes]`:value;}
export function executeSQL(db,sql,{maxRows=200,maxStatements=50}={}) {
  if(typeof sql!=='string'||!sql.trim())return {results:[],error:'Enter a SQL statement first.',statements:0};
  if(sql.length>50000)return {results:[],error:'Keep this classroom query under 50,000 characters.',statements:0};
  const results=[];let count=0,error=null;
  try {
    for(const statement of db.iterateStatements(sql)){
      let before,columns,values=[],truncated=false;
      try {
        count+=1;
        if(count>maxStatements){error=`Stopped after ${maxStatements} statements. Earlier statements have already executed.`;break;}
        before=db.exec('SELECT total_changes() AS n')[0].values[0][0];
        columns=statement.getColumnNames();
        while(statement.step()){
          if(values.length>=maxRows){truncated=true;break;}
          values.push(statement.get().map(safeValue));
        }
      }finally{
        // Free on errors and early exits, and finalize DML RETURNING before
        // sampling total_changes. The iterator safely tolerates this cleanup.
        statement.free();
      }
      const after=db.exec('SELECT total_changes() AS n')[0].values[0][0];
      results.push({columns,values,truncated,changes:after-before});
    }
  }catch(problem){error=problem.message;}
  return {results,error,statements:Math.min(count,maxStatements)};
}
export function inspectDatabase(db) {
  const schema=db.exec("SELECT name, type, sql FROM sqlite_schema WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY name;")[0]?.values??[];
  const tables=schema.map(([name,type,sql])=>{
    const columns=db.exec(`PRAGMA table_info(${quoteIdentifier(name)});`)[0]?.values.map(row=>({name:row[1],type:row[2],notNull:Boolean(row[3]),primaryKey:row[5]}))??[];
    return {name,type,sql,columns};
  });
  return {tables,foreignKeys:Boolean(db.exec('PRAGMA foreign_keys;')[0]?.values[0][0]),version:db.exec('SELECT sqlite_version();')[0].values[0][0]};
}
export function createETLDatabase(SQL) {
  const db=new SQL.Database();
  db.run(`PRAGMA foreign_keys=ON;
    CREATE TABLE states (state_code INT NOT NULL PRIMARY KEY, home_state TEXT NOT NULL);
    INSERT INTO states VALUES (26,'Michigan'),(56,'Wyoming'),(51,'Virginia');
    CREATE TABLE imported_employees (
      employee_id INT NOT NULL PRIMARY KEY CHECK (typeof(employee_id)='integer' AND employee_id>0),
      name TEXT NOT NULL CHECK(length(trim(name))>0),
      state_code INT NOT NULL REFERENCES states(state_code)
    );`);
  return db;
}
export function loadEmployeeBatch(db,records) {
  let statement;
  try {
    db.run('BEGIN;');
    statement=db.prepare('INSERT INTO imported_employees (employee_id,name,state_code) VALUES (?,?,?);');
    for(const record of records)statement.run([record.employee_id,record.name,record.state_code]);
    statement.free();statement=null;
    db.run('COMMIT;');
    return {loaded:records.length,error:null};
  }catch(problem){
    if(statement)statement.free();
    try {db.run('ROLLBACK;');}catch{/* No active transaction remains. */}
    return {loaded:0,error:problem.message};
  }
}
export function importedEmployees(db) {return db.exec('SELECT employee_id,name,state_code FROM imported_employees ORDER BY employee_id;')[0]??{columns:['employee_id','name','state_code'],values:[]};}
