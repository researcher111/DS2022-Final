/* Lecture 05: SQL. All 54 source PowerPoint slides are mapped in sourceSlides.
 * Editable, deterministic SVG builds use the shared player and handwriting tools.
 * The lower canvas remains open for classroom annotation. Displayed code is inert.
 */
(function () {
  'use strict';
  const P=window.DeckViz.palette,scenes=[];
  const MYSQL='https://dev.mysql.com/doc/refman/8.4/en/';
  const CONNECTOR='https://dev.mysql.com/doc/connector-python/en/';
  const title=(d,value)=>d.text('heading',80,88,value,46,P.ink,'start',650);
  const text=(d,k,x,y,value,size=30,color=P.ink)=>d.text(k,x,y,value,size,color);
  function code(d,k,lines,x=95,y=190,size=32,gap=51,active=-1,w=1080) {
    lines.forEach((line,i)=>{
      if(i===active)d.rect(k+'-active-'+i,x-14,y+i*gap-22,w,44,P.greenLight,'none',4,0);
      d.add(k+'-'+i,'text',{x,y:y+i*gap,fill:i===active?P.green:P.ink,'font-size':size,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-anchor':'start','dominant-baseline':'middle','xml:space':'preserve'},line);
    });
  }
  function box(d,k,x,y,w,h,label,active=false,color=P.green,size=30) {
    const fill=color===P.blue?P.blueLight:color===P.orange?P.orangeLight:color===P.red?P.redLight:P.greenLight;
    d.box(k,x,y,w,h,label,active?fill:P.white,active?color:P.line,size);
  }
  function flow(d,labels,active,y=280) {
    const w=labels.length===2?360:230,gap=100,x=(1280-(labels.length*w+(labels.length-1)*gap))/2;
    labels.forEach((label,i)=>{box(d,'flow-'+i,x+i*(w+gap),y,w,92,label,i===active);if(i<labels.length-1)d.arrow('flow-edge-'+i,x+i*(w+gap)+w+12,y+46,x+(i+1)*(w+gap)-12,y+46,P.green,4);});
  }
  function table(d,k,x,y,widths,rows,options={}) {d.table(k,x,y,widths,rows,Object.assign({rowHeight:58,fontSize:29},options));}
  function scene(name,states,draw,teaching,sourceSlides,extra={}) {
    const sourceNumbers=sourceSlides.split(',').flatMap(part=>{const ends=part.trim().split(/[–-]/).map(Number);return ends.length===1?ends:Array.from({length:ends[1]-ends[0]+1},(_,i)=>ends[0]+i);});
    const notes=[
      'Main idea: '+teaching.idea,
      ...teaching.builds.map((value,i)=>'Step '+(i+1)+': '+value),
      'Ask the class: '+teaching.question,
      'Expected answer: '+teaching.answer,
      ...(teaching.context?['Teaching context: '+teaching.context]:[]),
      'Source PowerPoint slides '+sourceSlides+'.'
    ].join('\n\n');
    scenes.push(Object.assign({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:name,kind:'visual',steps:states.length,states,draw,minutes:2,sourceSlides:sourceNumbers,teaching,notes},extra));
  }
  function exercise(activity,name,minutes,tasks,question,sourceSlides,teaching) {
    scene('Exercise: '+name,['Switch to the interactive exercise'],d=>{
      title(d,'Switch to the interactive');
      d.text('exercise-name',80,200,name+' · '+minutes+' minutes',40,P.green,'start',600);
      tasks.forEach((task,i)=>d.text('exercise-task-'+i,80,300+i*52,task,31,P.ink,'start'));
      d.text('exercise-discussion',80,455,'Return ready to explain:',28,P.muted,'start');
      d.text('exercise-question',80,505,question,33,P.green,'start');
      d.text('exercise-link-hint',80,145,'Open this exercise with ↗ below',27,P.muted,'start');
    },teaching,sourceSlides,{kind:'activity',activity,activityBreak:true,minutes});
  }
  const EMPLOYEES=[['1','Alice','26'],['2','Bob','56'],['3','Alice','56']];
  const JOBS=[['J01','Chef'],['J02','Waiter'],['J03','Bartender']];
  const ASSIGNMENTS=[['1','J01'],['1','J02'],['2','J02'],['2','J03'],['3','J01']];
  const STATES=[['26','Michigan'],['56','Wyoming']];
  const RESTAURANT=[['1','Alice','J01','Chef','26','Michigan'],['1','Alice','J02','Waiter','26','Michigan'],['2','Bob','J02','Waiter','56','Wyoming'],['2','Bob','J03','Bartender','56','Wyoming'],['3','Alice','J01','Chef','56','Wyoming']];
  const employeeTable=(d,k,x,y,rows=EMPLOYEES,hi=[])=>table(d,k,x,y,[180,160,175],[['employee_id','name','state_code'],...rows],{rowHeight:58,fontSize:27,highlightRows:hi});

  scene('SQL',['The lecture','The route'],(d,s)=>{
    d.text('course',80,135,'DS 2022',30,P.green,'start',650);d.text('name',80,235,'SQL',88,P.ink,'start',650);
    d.text('date',80,330,'September 22 & 24, 2026',30,P.muted,'start');
    if(s){text(d,'design',220,450,'Design',34);text(d,'query',635,450,'Query',34);text(d,'connect',1050,450,'Connect',34);}
  },{
    "idea": "SQL connects database design, questions about data, and the programs that use the results.",
    "builds": [
      "Point to SQL and connect it to last week’s scripts: we cleaned data, and now we need somewhere to organize and share it. Read the two dates as the two class meetings for this material.",
      "Point to Design, Query, and Connect in order. Say that we will decide where each fact belongs, ask for the rows we need, and connect Python to the database."
    ],
    "question": "What becomes harder when two people need to update the same cleaned dataset?",
    "answer": "They must coordinate changes, agree on the data’s structure, and avoid losing or contradicting each other’s work.",
    "context": "The September 24 meeting starts at Schema and SQL practice. Timings include discussion and group work across both meetings."
  }, '1–2',{kind:'title',minutes:1});

  scene('Questions about databases',['Individual ideas','A shared list'],(d,s)=>{
    title(d,'Questions about databases');text(d,'know',310,235,'What do you know?',36,P.blue);text(d,'want',940,235,'What do you want to know?',36,P.green);
    if(s){box(d,'group',410,355,460,100,'3–5 shared questions',true,P.green,35);}
  },{
    "idea": "A shared question list gives us specific things to investigate during the lecture.",
    "builds": [
      "Read the two prompts and ask students to look at their individual Know and Want-to-know notes. Have each person offer one question to their table before the group chooses its list.",
      "Point to 3–5 shared questions and give groups ten minutes to combine overlapping questions into that many clear items. Ask one person to record the list in the current class channel, then return ready to share the question their group most wants answered."
    ],
    "question": "Which question would your group most like to answer, and what would count as an answer?",
    "answer": "Accept a specific database question and an observable way to answer it, such as testing what happens when two users update one row.",
    "context": "Use the instructor’s current submission channel; the older short submission link has not been verified. Keep the questions available to revisit at the end and before the NoSQL lecture."
  }, '3',{kind:'activity',minutes:10});

  scene('Storage and databases',['Storage interfaces','Database responsibilities'],(d,s)=>{
    title(d,'Storage and databases');
    ['Files','Blocks','Objects'].forEach((v,i)=>box(d,'storage-'+i,90+i*395,355,310,95,v,s===0,P.blue,34));
    if(s){box(d,'db',365,185,550,95,'Database management',true,P.green,35);[0,1,2].forEach(i=>d.arrow('storage-edge-'+i,640,290,245+i*395,340,P.green,3));}
  },{
    "idea": "A database adds organization and rules to the storage that holds its data.",
    "builds": [
      "Point to Files, Blocks, and Objects. Describe a file by its path, a block by its address, and an object by its key; these are different ways to locate stored data.",
      "Point to Database management and follow the arrows down to storage. Explain that the database adds queries, relationships, rules, and coordinated access while still needing somewhere to keep its data."
    ],
    "question": "What does database management add beyond a place to save bytes?",
    "answer": "It organizes the data, answers queries, enforces declared rules, and coordinates access from applications.",
    "context": "The arrows show possible storage choices; one database need not use all three. Local files, university HPC filesystems, and Amazon S3 are familiar examples. This course does not require operating raw block devices."
  }, '5',{minutes:2});

  scene('Database operations',['Create','Read','Update','Delete'],(d,s)=>{
    title(d,'Database operations');const labels=['Create','Read','Update','Delete'];
    labels.forEach((v,i)=>box(d,'operation-'+i,65+i*305,210,235,85,v,i===s,P.green,32));
    const rows=s===0?[['1','Alice']]:s===1?[['1','Alice'],['2','Bob']]:s===2?[['1','Alice'],['2','Robert']]:[['1','Alice']];
    table(d,'rows',380,345,[170,350],[['id','name'],...rows],{rowHeight:55,fontSize:32,highlightRows:s===2?[2]:[]});
  },{
    "idea": "CRUD names the four basic ways an application works with stored records.",
    "builds": [
      "Point to the highlighted Create label and the Alice row. Say that creating a record adds a new row to an existing table.",
      "Point to Read and read the two displayed rows: 1 is Alice and 2 is Bob. Explain that retrieving these rows does not itself change either record.",
      "Point to employee 2 and compare Bob with Robert. The identifier stays 2 while the stored name changes, which makes this an update.",
      "Point to Delete and the remaining Alice row. Employee 2’s row is gone, but the table and its columns remain."
    ],
    "question": "Which operation changes Bob’s name while keeping the same employee record?",
    "answer": "Update changes the name in the row identified by employee 2.",
    "context": "Each build illustrates an operation rather than one continuous script; the read example starts with two existing rows. CRUD Create usually means inserting a record, while SQL CREATE defines an object such as a table."
  }, '4, 6',{minutes:2});

  scene('Database management system',['A request','Query processing','Stored data and metadata'],(d,s)=>{
    flow(d,['Application','DBMS','Storage'],Math.min(s,2),270);
    if(s>=1)text(d,'processing',640,440,'plan  execute  enforce rules',29,P.green);
    if(s===2){text(d,'data',1010,230,'data + metadata',29,P.blue);}
  },{
    "idea": "The DBMS turns application requests into controlled access to stored data.",
    "builds": [
      "Read the DBMS definition, then point from Application toward DBMS. Explain that the application asks for an operation instead of editing the database’s storage directly.",
      "Point to plan, execute, and enforce rules beneath the DBMS. Say that the DBMS chooses how to perform the request and checks the rules the database declares.",
      "Point to data + metadata above Storage. Use one employee row as data and its column definitions or key constraints as metadata describing how that data is organized."
    ],
    "question": "If two applications write to the same table, where can we enforce one shared rule for both?",
    "answer": "Declare the rule as a database constraint so the DBMS checks writes from both applications.",
    "context": "The database is the managed data and its objects; the DBMS is the software that manages them. A database can enforce only the rules represented in its constraints and transaction logic."
  }, '7',{kind:'definition',term:'DBMS',definition:'Software that stores, queries, and controls access to a database.',minutes:2});

  scene('Data models',['Relational','Other common models','Workload matters'],(d,s)=>{
    title(d,'Data models');
    if(!s)table(d,'relational',245,205,[215,290,285],[['id','name','state'],...EMPLOYEES],{rowHeight:67,fontSize:33});
    if(s===1){[['Key-value','Redis'],['Document','MongoDB'],['Wide-column','Cassandra'],['Graph','Neo4j']].forEach(([a,b],i)=>{text(d,'model-'+i,380,205+i*88,a,34,P.green);text(d,'example-'+i,880,205+i*88,b,31,P.muted);});}
    if(s===2){flow(d,['Data shape','Queries','Constraints'],1,250);text(d,'choice',640,440,'Products combine capabilities',34,P.orange);}
  },{
    "idea": "Choose a data model by the relationships and operations the application needs.",
    "builds": [
      "Read one row across the table and then point down a column. A relational model organizes records into tables with named attributes, and a repeated name can still belong to different records.",
      "Point to each model and its example: key-value, document, wide-column, and graph. Ask students what each name suggests about how related information is grouped or found.",
      "Follow Data shape, Queries, and Constraints from left to right. Read Products combine capabilities and explain that a product label alone does not tell us how well it fits a workload."
    ],
    "question": "What information would you want before choosing a database for an application?",
    "answer": "The data’s shape and relationships, the queries and updates it must support, the rules it must enforce, and its operational requirements.",
    "context": "MySQL, PostgreSQL, SQLite, SQL Server, and Oracle are relational examples. SQL is a language, and products can support several models. Nonrelational databases can validate schemas and types, and neither family is inherently faster for every workload."
  }, '8–11',{minutes:3,sources:['https://www.mongodb.com/docs/manual/core/schema-validation/','https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SQLtoNoSQL.html']});

  scene('Scaling choices',['Vertical','Horizontal','Independent of data model'],(d,s)=>{
    title(d,'Scaling choices');text(d,'scaling-method',640,155,s?'Horizontal':'Vertical',32,P.green);
    if(!s){box(d,'machine',405,185,470,290,'One larger machine',true,P.blue,34);[0,1,2,3].forEach(i=>d.rect('capacity-'+i,465+i*80,380,58,45,P.blue,P.blue,3));}
    else{[0,1,2].forEach(i=>box(d,'node-'+i,125+i*365,240,300,150,'Node '+(i+1),true,P.green,34));d.line('network',275,435,1005,435,P.green,4);[0,1,2].forEach(i=>d.line('link-'+i,275+i*365,390,275+i*365,435,P.green,4));if(s===2)text(d,'scope',640,510,'SQL and NoSQL systems can use either',31,P.orange);}
  },{
    "idea": "Scaling up one machine and spreading work across machines are different engineering choices.",
    "builds": [
      "Point to Vertical and the larger machine. Describe adding CPU, memory, or storage throughput while the work still runs on one machine.",
      "Point to Horizontal and count the three connected nodes. Explain that distributing work also creates questions about where data lives, how machines communicate, and what happens when one fails.",
      "Read SQL and NoSQL systems can use either. Emphasize that the data model does not decide the scaling architecture, then ask what new costs appear when work crosses the network."
    ],
    "question": "Why might three machines deliver less than three times the performance?",
    "answer": "They spend time communicating and coordinating, and the work or data may not divide evenly among them.",
    "context": "Horizontal scaling can involve partitioning and replication, which serve different purposes. Distributed relational systems such as Spanner exist; check a product’s actual scaling capabilities rather than treating SQL and NoSQL as scaling categories."
  }, '12',{minutes:2,sources:['https://cloud.google.com/spanner/docs/compute-capacity']});

  scene('Recovery and backlog',['Service interruption','Requests accumulate','Controlled recovery'],(d,s)=>{
    title(d,'Recovery and backlog');
    box(d,'app',90,260,250,90,'Applications',true,P.blue,31);box(d,'db',930,260,250,90,'Database',s===2,P.green,34);
    d.arrow('request',355,305,915,305,s===0?P.line:P.green,4);
    const count=s===0?2:s===1?9:4;for(let i=0;i<count;i++)d.rect('request-'+i,420+(i%5)*85,210+Math.floor(i/5)*100,60,45,P.orangeLight,P.orange,5,2);
    text(d,'status',640,465,['Unavailable','Growing queue','Retry with backoff'][s],35,P.orange);
  },{
    "idea": "Restoring a failed service does not instantly clear the work that accumulated during the failure.",
    "builds": [
      "Point from Applications to the unavailable Database and the waiting request markers. Ask students what the application should do with work that cannot complete yet.",
      "Point to the larger queue and read Growing queue. Explain that new requests and repeated attempts can build up even while the underlying service is recovering.",
      "Point to the smaller queue and read Retry with backoff. Explain that spacing retries helps control recovery load, and that repeated writes also need a way to avoid duplicate effects."
    ],
    "question": "If a client times out after sending a write, what does it still not know?",
    "answer": "It may not know whether the database committed the write, so repeating it could apply the change twice.",
    "context": "Use this as a hypothetical failure and recovery scenario; the incident dates, providers, and durations in the older material have not been verified. Backoff alone does not make retries safe: the application also needs an idempotency or duplicate-detection strategy."
  }, '13',{minutes:2,sources:['https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/']});

  scene('A database in use',['Choose a product','Bring evidence'],(d,s)=>{
    title(d,'A database in use');['MySQL','Oracle','MongoDB','DynamoDB'].forEach((v,i)=>text(d,'product-'+i,215+i*280,235,v,33,i===s?P.green:P.ink));
    if(s)text(d,'question',640,400,'Who uses it, for which workload?',38,P.green);
  },{
    "idea": "A documented workload tells us more about a database choice than a company name alone.",
    "builds": [
      "Point to MySQL, Oracle, MongoDB, and DynamoDB, and assign one product to each table group. Ask students to look for an organization’s own engineering account or a named customer case study.",
      "Read Who uses it, for which workload? and give groups five minutes to record the product, organization, application or data, and a dated source. Return to the room ready to explain the particular workload supported by their evidence."
    ],
    "question": "What did your source establish about how the organization uses this database?",
    "answer": "A complete response names the organization, the specific application or data, and the source; it also identifies any workload details the source does not provide.",
    "context": "A customer example does not establish that the organization uses the product for every application. Keep unsupported inferences separate from what the primary source actually states."
  }, '14',{kind:'activity',minutes:5});

  scene('Related tables',['Entities','Relationships','Rules'],(d,s)=>{
    title(d,'Related tables');employeeTable(d,'employees',65,230);
    table(d,'states',805,230,[150,240],[['state_code','home_state'],...STATES],{rowHeight:58,fontSize:27});
    if(s>=1)d.arrow('relationship',600,317,785,317,P.green,4);
    if(s===2)text(d,'constraint',640,510,'Declared constraints protect relationships',31,P.green);
  },{
    "idea": "Related tables give each kind of fact a clear home while keys connect the records.",
    "builds": [
      "Read employee 1 as Alice with state_code 26, then read state 26 as Michigan. Point out that the employee table stores the person’s state code while the state table stores the state’s name.",
      "Follow the arrow between the tables and point to the matching 26 values. Explain that the shared code lets us connect the employee to the state without copying Michigan into every employee row.",
      "Read Declared constraints protect relationships. Ask what should happen if an employee names a state code that the state table does not contain."
    ],
    "question": "If Michigan’s stored name needs correcting, which table should own that correction?",
    "answer": "The state table should own the state name, so one correction serves every employee who references its code.",
    "context": "Primary keys identify rows, foreign keys can enforce references, and joins combine data for a query. The transaction examples assume MySQL with InnoDB; guarantees depend on the database engine and configuration."
  }, '15–16',{activity:'keys',minutes:2});

  scene('Schema',['Field definitions','Different records','Constraints'],(d,s)=>{
    table(d,'schema',110,245,[290,240,470],[['field','type','example'],['name','text',s===0?'Michael Jordan':'Adele Adkins'],['birth_year','integer',s===0?'1963':'1988'],['retired','boolean','true / false']],{rowHeight:60,fontSize:29});
    if(s===2)text(d,'required',640,510,'name: required',31,P.green);
  },{
    "idea": "A schema describes the structure and rules that many different records share.",
    "builds": [
      "Read across field, type, and example. Use name as text and birth_year as an integer to separate the definition of a column from the particular value stored in one record.",
      "Point to Adele Adkins and 1988 replacing the earlier example values. Ask what stayed the same: the field names and types still describe the record.",
      "Point to name: required. Explain that a schema can require a value as well as assign its type; this is a rule the database can check when data is written."
    ],
    "question": "When the example changes from Michael Jordan to Adele Adkins, which parts are data and which parts are schema?",
    "answer": "The names and birth years are data. The column names, their types, and the required-name rule are schema.",
    "context": "The boolean example shows true and false as possible forms rather than asserting anyone’s current retirement status. The fuller example also includes country and realm. Products use schema as a namespace term too; MySQL commonly treats SCHEMA and DATABASE as synonyms."
  }, '17–18',{kind:'definition',term:'Schema',definition:'The defined structure, types, relationships, and constraints of data.',minutes:2,sources:[MYSQL+'create-database.html']});

  scene('Tables and views',['Stored rows','A saved query','A derived result'],(d,s)=>{
    title(d,'Tables and views');employeeTable(d,'base',75,220);
    if(s>=1){d.arrow('view-edge',620,322,760,322,P.green,4);box(d,'view',785,240,350,95,'View',true,P.green,35);}
    if(s===2)table(d,'result',795,365,[130,200],[['id','name'],['1','Alice']],{rowHeight:58,fontSize:30});
    if(s>=1)text(d,'query',915,185,'state_code = 26',28,P.muted);
  },{
    "idea": "An ordinary view exposes the result of a saved query over underlying data.",
    "builds": [
      "Point to the three stored employee rows and identify the one with state_code 26. Ask students to hold that row in mind as the result we want to expose.",
      "Read state_code = 26 above View and follow the arrow from the base table. Explain that the view stores this query definition and presents its result through a table-like interface.",
      "Read the result row, 1 and Alice, and connect it to the matching base row. Explain that querying the view again can produce a different result when the underlying data changes."
    ],
    "question": "If employee 1 moves to state 56, will this ordinary view necessarily keep showing that employee?",
    "answer": "No. When the changed data is visible to the query, employee 1 no longer meets state_code = 26 and drops out of the result.",
    "context": "Transaction visibility still applies when a view is queried. An ordinary view is not an independent snapshot or an automatic speed improvement; a materialized view is a separate feature where supported."
  }, '19',{minutes:2,sources:[MYSQL+'create-view.html']});

  scene('Objects and rows',['An object graph','Relational rows','A mapping layer','Load an employee object','Change the object in memory','Commit the change'],(d,s)=>{
    if(s<3){
      title(d,'Objects and rows');box(d,'object',80,215,300,90,'Employee object',true,P.blue,31);box(d,'jobs',95,395,270,65,'jobs: [...]',true,P.blue,30);d.arrow('object-link',230,320,230,380,P.blue,3);
      table(d,'row',865,230,[125,180],[['id','name'],['1','Alice']],{rowHeight:64,fontSize:30});
      if(s>=1)d.arrow('mapping',395,275,835,295,P.green,4);
      if(s===2){box(d,'orm',485,360,270,80,'ORM',true,P.green,34);text(d,'orm-name',640,510,'Object-relational mapper',30,P.green);}
      return;
    }
    title(d,'ORM pseudocode');
    d.text('orm-code-label',80,165,'Python-like pseudocode',28,P.muted,'start');
    const lines=['employee = orm.get(Employee, 1)','employee.state_code = 56','orm.commit()'];
    code(d,'orm-code',lines.slice(0,s-2),80,225,27,48,s-3,535);
    d.text('orm-sql-label',720,165,'Illustrative SQL',28,P.muted,'start');
    if(s===3)code(d,'orm-sql',['SELECT * FROM employees','WHERE employee_id = 1;'],720,225,27,48,-1,475);
    else if(s===4)d.text('orm-no-sql',720,225,'No UPDATE yet',30,P.muted,'start');
    else code(d,'orm-sql',['UPDATE employees','SET state_code = 56','WHERE employee_id = 1;','COMMIT;'],720,225,27,48,-1,475);
    d.text('orm-memory-label',80,435,'Object in memory',28,P.blue,'start');
    code(d,'orm-memory',['employee_id: 1','name: "Alice"','state_code: '+(s===3?'26':'56')],80,490,28,46,s===4?2:-1,535);
    d.text('orm-database-label',700,435,'employees table',28,P.green,'start');
    table(d,'orm-database',700,475,[185,120,190],[['employee_id','name','state_code'],['1','Alice',s===5?'56':'26']],{rowHeight:56,fontSize:27,highlightRows:s===5?[1]:[]});
    if(s===3)d.arrow('orm-transfer',680,530,625,530,P.blue,3);
    if(s===5)d.arrow('orm-transfer',625,530,680,530,P.green,3);
  },{
    "idea": "An ORM maps database rows to program objects and turns saved object changes into SQL operations.",
    "builds": [
      "Point to Employee object and its jobs list, then to the row containing 1 and Alice. Explain that an object can hold references and collections while a row contains values in declared columns.",
      "Follow the mapping arrow from the object toward the table. Ask where the jobs collection would go and how the program could reconnect those rows to this employee.",
      "Read ORM as object-relational mapper. It maps object fields and relationships to database columns and related rows. Say that the next steps show a small example using employee 1, Alice.",
      "Read employee = orm.get(Employee, 1). Employee is the mapped class, 1 is the employee’s identifier, and employee is the returned object. Follow the SELECT to Alice’s row, then the arrow back to the object in memory. Both show state_code 26.",
      "Read employee.state_code = 56 and point to the changed object field. The stored row still shows 26: this assignment changes memory, and our example has not sent an UPDATE yet. Ask students which value is currently stored.",
      "Read orm.commit(), then follow the UPDATE and COMMIT on the right. In this example, the ORM sends the pending change and commits the transaction. The stored row now has state_code 56, while employee_id 1 and the name Alice stay the same."
    ],
    "question": "After assigning employee.state_code = 56, has this example changed the stored row yet?",
    "answer": "No. The object has changed in memory. In this example, orm.commit() sends the pending UPDATE and commits it, so the stored row changes from 26 to 56.",
    "context": "The Python-like calls are teaching pseudocode, not a particular library’s API. Assume Employee is already mapped to employees, employee 1 exists, and the ORM opens a transaction and tracks this object’s changes. This example sends the pending UPDATE during commit; real libraries can flush earlier, including before queries. SQL uses literal values for readability; real ORM operations normally bind parameters. State 56 exists, and database constraints still apply. Employee 3 is the other Alice and remains unchanged because the update uses employee_id 1. Mapping a jobs collection also requires identifiers and relationship rules. SQLAlchemy, Django ORM, and Peewee are examples; ORMs do not remove query costs or database-design decisions."
  }, '20, 38',{minutes:4,sources:['https://docs.sqlalchemy.org/en/20/orm/quickstart.html']});

  scene('Primary key',['A unique identifier','A repeated name','A rejected duplicate key'],(d,s)=>{
    table(d,'pk',200,245,[260,320,300],[['employee_id','name','state_code'],...EMPLOYEES],{rowHeight:62,fontSize:31,highlightCols:[0],highlightRows:s===1?[1,3]:[]});
    if(s===2)text(d,'reject',640,520,'Another employee_id = 1: reject',30,P.red);
  },{
    "idea": "A primary key identifies a row even when other values, such as names, repeat.",
    "builds": [
      "Read the definition and point down the highlighted employee_id column: 1, 2, and 3. Each value identifies one employee row, and none is NULL.",
      "Point to the two highlighted Alice rows and read their identifiers aloud. Explain that employee 1 and employee 3 are different people whose names happen to match.",
      "Point to Another employee_id = 1: reject. Ask students to distinguish proposing a duplicate key from storing another person named Alice."
    ],
    "question": "Could a new employee be named Alice without violating this primary key?",
    "answer": "Yes, provided the new employee has a different non-NULL employee_id and satisfies the table’s other constraints.",
    "context": "A table has one primary key constraint, which can contain several columns, and may have other unique constraints. Prefer stable identifiers. The same rule identifies inventory rows by item_id in the keys activity."
  }, '21',{kind:'definition',term:'Primary key',definition:'A column or column combination that uniquely identifies every row and cannot contain NULL.',activity:'keys',minutes:3,sources:[MYSQL+'create-table.html']});

  scene('Foreign key',['A referenced row','A valid child','An invalid reference'],(d,s)=>{
    title(d,'Foreign key');employeeTable(d,'employees',70,225,s===2?[['1','Alice','99']]:[EMPLOYEES[0]]);
    table(d,'states',800,225,[150,250],[['state_code','home_state'],...STATES],{rowHeight:60,fontSize:28,highlightRows:s===2?[]:[1]});
    d.arrow('reference',605,315,780,315,s===2?P.red:P.green,4);
    if(s>=1)text(d,'outcome',640,455,s===2?'No state 99: reject':'State 26 exists: accept',33,s===2?P.red:P.green);
  },{
    "idea": "A foreign key checks that a stored reference points to an allowed parent key.",
    "builds": [
      "Point to employee 1’s state_code 26 and then to state 26 in the lookup table. Follow the arrow from the employee’s reference to the state it names.",
      "Read State 26 exists: accept. Explain that the referenced row satisfies this relationship check; the employee row still has to satisfy its other constraints.",
      "Point to 99 replacing the employee’s state code and scan the state table for a match. Read No state 99: reject and explain that the database prevents an unsupported reference."
    ],
    "question": "Why does the reference to 99 fail while the reference to 26 succeeds?",
    "answer": "The state table contains key 26 but contains no row with key 99.",
    "context": "A foreign key alone can allow NULL; use NOT NULL when a reference is required. The teaching examples reference a primary or unique key. Changes to parent rows follow the configured action, such as restriction or cascading."
  }, '22',{activity:'keys',minutes:3,sources:[MYSQL+'create-table-foreign-keys.html']});

  scene('Matching rows',['The tables','A matching value','Combined data'],(d,s)=>{
    title(d,'Matching rows');
    employeeTable(d,'employee',60,195,[EMPLOYEES[0]]);table(d,'state',815,195,[140,245],[['state_code','home_state'],STATES[0]],{rowHeight:58,fontSize:27});
    if(s>=1)d.arrow('match',595,282,795,282,P.green,4);
    if(s===2)table(d,'joined',360,395,[225,335],[['name','home_state'],['Alice','Michigan']],{rowHeight:57,fontSize:32});
  },{
    "idea": "A join produces combinations of rows whose values satisfy the match condition.",
    "builds": [
      "Read the employee row as Alice with state_code 26 and the state row as 26, Michigan. Ask which values tell us these records describe a related person and place.",
      "Follow the arrow joining the two 26 values. Explain that the match condition compares those columns and identifies this pair of rows.",
      "Read Alice and Michigan in the combined result. Point back to the original location of each value to show that the query selected columns from both matching rows."
    ],
    "question": "Where does each value in the Alice, Michigan result come from?",
    "answer": "Alice comes from the employee row, and Michigan comes from the state row whose state_code matches that employee’s 26.",
    "context": "A join does not require a declared foreign key and does not permanently merge its input tables. Several matching rows can produce several result combinations; the condition and the data determine the result."
  }, '16, 22',{activity:'keys',minutes:2,sources:[MYSQL+'join.html']});

  exercise('keys','Keys & joins',3,
    ['Try an orphan with the foreign key on, then off.','Compare INNER JOIN and LEFT JOIN.'],
    'Which join keeps the orphan?','21–22',
    {
    "idea": "A constraint controls what data may be stored, while a join controls which stored rows appear in a result.",
    "builds": [
      "Open the green ↗ toolbar link to Keys & joins and reset the activity if it was used earlier. Give students three minutes to choose Orphan maker, try INSERT with foreign-key enforcement on, then turn enforcement off, try again, and compare INNER JOIN with LEFT JOIN. Return to the slide and ask: Which join keeps the orphan, and what appears in its maker fields?"
    ],
    "question": "Which join keeps the orphan item, and what appears in its maker fields?",
    "answer": "LEFT JOIN keeps the orphan item and shows NULL for the missing maker fields; INNER JOIN omits that unmatched item.",
    "context": "With enforcement enabled, the model rejects the orphan insert. Disabling it is a classroom comparison of invalid stored data, not a recommendation for production constraints. The next section considers how related writes can share one transaction."
  });

  scene('A transaction',['Before','Pending changes','Commit','Alternative: rollback'],(d,s)=>{
    title(d,'A transaction');const values=(s===1||s===2)?[90,60]:[100,50];
    box(d,'account-a',150,225,360,170,'Account A',true,P.blue,34);box(d,'account-b',770,225,360,170,'Account B',true,P.green,34);
    text(d,'amount-a',330,355,values[0],44,P.blue);text(d,'amount-b',950,355,values[1],44,P.green);d.arrow('transfer',530,300,750,300,P.orange,4);
    text(d,'state',640,480,['Before transfer','Both changes pending','COMMIT','Alternative: ROLLBACK'][s],35,s===3?P.orange:P.green);
  },{
    "idea": "A transaction gives related changes one commit-or-rollback outcome.",
    "builds": [
      "Point to A with 100 and B with 50. Ask students to track a transfer of ten units while checking that the combined balance stays 150.",
      "Read the pending balances, 90 and 60, and emphasize Both changes pending. Both proposed changes belong to one unit of work, but they have not yet been committed.",
      "Point to COMMIT and read the same 90 and 60 balances. Explain that the complete transfer now becomes the committed result.",
      "Read Alternative: ROLLBACK before discussing the restored 100 and 50. Explain that this is the other outcome from the pending stage, abandoning the transfer instead of committing it."
    ],
    "question": "If the transfer is abandoned before commit, what balances should remain?",
    "answer": "A should remain at 100 and B at 50; neither half of the transfer should become a committed change.",
    "context": "The rollback build is an alternative branch, not an undo of the commit shown immediately before it. Transactions group statements; correct business logic and appropriate constraints are still required."
  }, '23',{activity:'transactions',minutes:3,sources:[MYSQL+'commit.html']});

  scene('ACID properties',['Atomicity','Consistency','Isolation','Durability'],(d,s)=>{
    title(d,'ACID properties');const terms=['Atomicity','Consistency','Isolation','Durability'];text(d,'term',640,220,terms[s],50,P.green);
    const labels=[['All changes','or none'],['Declared rules','remain satisfied'],['Concurrent work','controlled visibility'],['Committed result','survives failures']][s];
    box(d,'left',170,345,400,95,labels[0],true,P.blue,32);box(d,'right',710,345,400,95,labels[1],true,P.green,32);d.arrow('property',590,392,690,392,P.green,4);
  },{
    "idea": "ACID names distinct guarantees about completing, validating, coordinating, and preserving transactions.",
    "builds": [
      "Read Atomicity and All changes or none. Connect it to the transfer: the debit and credit must share one outcome rather than leaving half a transfer committed.",
      "Read Consistency and Declared rules remain satisfied. Ask which rules the transfer needs, such as preserving the total and preventing a balance from going below its allowed limit.",
      "Read Isolation and point from Concurrent work to controlled visibility. Explain that an isolation level determines what another transaction may observe while this work is in progress.",
      "Read Durability and connect Committed result to survives failures. Explain that a committed change must persist under the database’s configured durability guarantees and supported failure model."
    ],
    "question": "Which ACID property concerns what another transaction can see during an unfinished transfer?",
    "answer": "Isolation governs that transaction’s visibility and interaction with the unfinished work.",
    "context": "The database cannot infer every business rule; application logic and declared constraints must express them. Isolation levels differ, and durability depends on configuration and the failure model. Financial, clinical, inventory, and regulated records all motivate careful correctness requirements."
  }, '23',{activity:'transactions',minutes:3,sources:['https://dev.mysql.com/doc/refman/8.0/en/mysql-acid.html',MYSQL+'innodb-transaction-isolation-levels.html']});

  exercise('transactions','Transactions',3,
    ['Enable credit failure. Begin, debit, then credit.'],
    'Why do committed balances stay unchanged?','23',
    {
    "idea": "A failed transfer must discard its private changes before they become committed balances.",
    "builds": [
      "Open the green ↗ toolbar link to Transactions and reset the activity if it was used earlier. Give students three minutes to enable credit failure before BEGIN, then begin, debit, and attempt the credit while comparing the private and committed balances. Return to the slide and ask: Why do the committed balances stay unchanged?"
    ],
    "question": "Why do the committed balances stay unchanged after the credit fails?",
    "answer": "The debit was still private, and this application model rolls back the whole transfer when the credit fails, so neither change commits.",
    "context": "The model makes rollback an application response to the failed credit. An arbitrary SQL error does not necessarily roll back an entire transaction automatically. Next, connect transaction safety to table designs that avoid repeating inconsistent facts."
  });

  scene('Normalization',['Repeated facts','Dependencies','Separate responsibilities'],(d,s)=>{
    flow(d,['1NF','2NF','3NF'],s,300);text(d,'rule',640,470,['One value per cell','Depend on the whole key','Separate transitive dependencies'][s],34,P.green);
  },{
    "idea": "Normalization separates facts according to what determines them.",
    "builds": [
      "Point to 1NF and read ‘One value per cell.’ For our restaurant, each assignment needs one job value rather than a list of jobs.",
      "Point to 2NF and read ‘Depend on the whole key.’ A fact about an employee alone should not be repeated in every employee-and-job assignment.",
      "Point to 3NF and read ‘Separate transitive dependencies.’ When a state code determines a state name, keep that mapping in its own table."
    ],
    "question": "What tells us which facts should move into separate tables?",
    "answer": "Their functional dependencies: which identifiers determine each fact.",
    "context": "These labels are introductory shorthand. Formal definitions consider candidate keys and non-prime attributes; adding a surrogate primary key does not erase those dependencies. Atomic values depend on the chosen domain, and normal forms beyond 3NF also exist."
  }, '24–25',{kind:'definition',term:'Normalization',definition:'Organizing tables around dependencies to reduce repeated facts and modification anomalies.',activity:'normalization',minutes:2});

  scene('Restaurant assignments',['Several jobs in one cell','One employee, several assignments'],(d,s)=>{
    title(d,'Restaurant assignments');
    if(!s)table(d,'lists',155,215,[220,200,550],[['employee_id','name','jobs'],['1','Alice','Chef, Waiter'],['2','Bob','Waiter, Bartender'],['3','Alice','Chef']],{rowHeight:66,fontSize:30,highlightCols:[2]});
    else{table(d,'one',165,210,[230,260],[['employee_id','name'],['1','Alice']],{rowHeight:65,fontSize:31});table(d,'many',810,210,[270],[['job'],['Chef'],['Waiter']],{rowHeight:65,fontSize:31});d.arrow('assign',675,280,790,280,P.green,4);}
  },{
    "idea": "One employee can have several job assignments, even when employees share a name.",
    "builds": [
      "Read the three rows: employee 1 has Chef and Waiter, employee 2 has Waiter and Bartender, and employee 3 has Chef. Point to the two Alices and ask whether a name identifies one employee.",
      "Point to employee 1 on the left and follow the arrow to Chef and Waiter on the right. These are two assignments for the same person, so each assignment needs its own row."
    ],
    "question": "How can we distinguish the two employees named Alice?",
    "answer": "Use employee_id: Alice 1 and Alice 3 are different people.",
    "context": "Employee 1 lives in Michigan; employees 2 and 3 live in Wyoming. A comma-separated job list makes individual assignments harder to query and constrain."
  }, '26',{activity:'normalization',minutes:2});

  scene('First normal form',['Separate assignment rows','A composite key'],(d,s)=>{
    title(d,'First normal form');table(d,'restaurant',65,170,[190,130,155,175,160,205],[['employee_id','name','job_code','job','state_code','home_state'],...RESTAURANT],{rowHeight:54,fontSize:26,highlightCols:s?[0,2]:[]});
    if(s)text(d,'key',640,515,'Key: (employee_id, job_code)',29,P.green);
  },{
    "idea": "In this 1NF table, each row represents one employee’s assignment to one job.",
    "builds": [
      "Point to employee 1’s first two rows: J01 is Chef and J02 is Waiter. Count five assignments, with one job in each row.",
      "Point to the highlighted employee_id and job_code columns. Neither column is unique alone, but the pair identifies one assignment."
    ],
    "question": "Why is employee_id alone insufficient as the assignment key?",
    "answer": "An employee can have multiple jobs, so the same employee_id appears in more than one assignment row.",
    "context": "The composite key is (employee_id, job_code), and the two Alices retain their distinct employee IDs. Adding a separate row ID would not remove the partial dependencies in this table."
  }, '26',{activity:'normalization',minutes:3});

  scene('An update anomaly',['Repeated employee facts','Only one row updated','One inconsistent person'],(d,s)=>{
    title(d,'An update anomaly');const rows=RESTAURANT.filter(r=>r[0]==='1').map(r=>[r[0],r[2],r[4],r[5]]);if(s>=1)rows[0]=['1','J01','56','Wyoming'];
    table(d,'move',140,220,[245,235,245,275],[['employee_id','job_code','state_code','home_state'],...rows],{rowHeight:78,fontSize:31,highlightRows:s?[1]:[]});
    if(s===2)text(d,'problem',640,505,'Employee 1 now has two home states',31,P.red);
  },{
    "idea": "Repeating an employee’s home state allows different rows to disagree about that person.",
    "builds": [
      "Point to employee 1’s two rows, both showing state 26, Michigan. Ask how many rows must change when this employee moves to Wyoming.",
      "Point to the changed J01 row: it now shows 56, Wyoming. Read the J02 row below it, which still says 26, Michigan.",
      "Read ‘Employee 1 now has two home states.’ Explain that one intended change became inconsistent because one stored copy was missed."
    ],
    "question": "Which row was missed when employee 1 moved?",
    "answer": "The J02 assignment row still stores Michigan, so both assignment rows must be updated in this design.",
    "context": "Alice with employee_id 3 is another person and must not change just because the names match. A transaction can group the two updates, while normalization avoids repeating the employee fact in the first place."
  }, '27',{activity:'normalization',minutes:3});

  scene('Partial dependencies',['The assignment key','Employee facts','Job facts'],(d,s)=>{
    title(d,'Partial dependencies');box(d,'emp-key',100,205,390,80,'employee_id',true,P.blue,34);box(d,'job-key',790,205,390,80,'job_code',true,P.green,34);
    text(d,'composite',640,160,'(employee_id, job_code)',30,P.muted);
    if(s>=1){d.arrow('emp-dep',295,300,295,365,P.blue,4);box(d,'emp-facts',100,380,390,85,'name, state_code, home_state',true,P.blue,25);}
    if(s===2){d.arrow('job-dep',985,300,985,365,P.green,4);box(d,'job-facts',790,380,390,85,'job',true,P.green,34);}
  },{
    "idea": "A partial dependency occurs when a non-key fact needs only part of a composite key.",
    "builds": [
      "Read the assignment key, (employee_id, job_code). Point to its two parts and ask which facts describe the employee and which describe the job.",
      "Follow the blue arrow from employee_id to name, state_code, and home_state. Those employee facts do not need job_code to determine their values.",
      "Follow the green arrow from job_code to job. The job title does not need employee_id, so both groups of facts depend on only part of the assignment key."
    ],
    "question": "Which part of the composite key determines the title Chef?",
    "answer": "job_code alone: J01 determines Chef, regardless of the employee assigned to it.",
    "context": "The example assumes one name and home state per employee_id and one title per job_code. 2NF removes partial dependencies of non-prime attributes on candidate keys; adding an arbitrary row ID does not repair them."
  }, '25, 28',{activity:'normalization',minutes:3});

  scene('Second normal form',['Employee facts','Job facts','Assignments remain'],(d,s)=>{
    title(d,'Second normal form');
    table(d,'people',50,220,[155,100,150,180],[['employee_id','name','state_code','home_state'],['1','Alice','26','Michigan'],['2','Bob','56','Wyoming'],['3','Alice','56','Wyoming']],{rowHeight:62,fontSize:25});
    text(d,'employee-label',345,170,'Employees',30,P.blue);
    if(s===1){text(d,'job-label',955,170,'Jobs',30,P.green);table(d,'jobs',775,220,[160,215],[['job_code','job'],...JOBS],{rowHeight:62,fontSize:29});}
    if(s===2){text(d,'assignment-label',955,170,'Assignments',30,P.green);table(d,'assignments',775,220,[200,175],[['employee_id','job_code'],...ASSIGNMENTS],{rowHeight:45,fontSize:27});}
    if(!s)text(d,'fact',930,330,'One row per employee',30,P.green);
  },{
    "idea": "Separate employee facts and job facts, then retain their connections as assignments.",
    "builds": [
      "Point to Employees and count three rows. Each employee’s name and home state are now stored once, including separate rows for Alice 1 and Alice 3.",
      "Point to Jobs on the right and read J01 → Chef, J02 → Waiter, and J03 → Bartender. Each title is stored once for its job code.",
      "Point to Assignments, now shown on the right, and count five pairs. These employee_id and job_code references preserve every original assignment without repeating employee names or job titles."
    ],
    "question": "Where would you look to find both jobs held by employee 1?",
    "answer": "Find employee 1’s J01 and J02 rows in Assignments, then look up those codes in Jobs.",
    "context": "Jobs remains part of the design when the display switches to Assignments. Assignments has the composite key (employee_id, job_code) and foreign keys to both tables. Employees still contains the state_code-to-home_state dependency."
  }, '28',{activity:'normalization',minutes:3});

  scene('A transitive dependency',['Employee to state code','State code to state name'],(d,s)=>{
    title(d,'A transitive dependency');flow(d,['employee_id','state_code','home_state'],s?2:0,260);
    text(d,'id',305,425,'1',36,P.blue);text(d,'code',640,425,'26',36,P.green);text(d,'state',975,425,'Michigan',36,P.green);
  },{
    "idea": "The employee’s state name is determined through the employee’s state code.",
    "builds": [
      "Point from employee_id 1 to state_code 26. Under this example’s rules, choosing the employee determines one home-state code.",
      "Continue from state_code 26 to Michigan. The code determines the name, so employee_id reaches home_state through another non-key attribute."
    ],
    "question": "If several employees have state_code 26, how many copies of Michigan would their employee rows store?",
    "answer": "One copy per employee row, even though all those names describe the same state code.",
    "context": "The stated rule is state_code → home_state. It does not require treating arbitrary names as globally unique identifiers. This transitive dependency motivates a separate States table."
  }, '28–29',{activity:'normalization',minutes:2});

  scene('Third normal form',['A state lookup','Employee references','One state-name update'],(d,s)=>{
    title(d,'Third normal form');employeeTable(d,'employees',55,235);
    table(d,'states',785,235,[175,260],[['state_code','home_state'],...STATES],{rowHeight:58,fontSize:29,highlightRows:s===2?[1]:[]});
    if(s>=1)d.arrow('lookup',590,322,765,322,P.green,4);
    if(s===2)text(d,'update',640,510,'State names live in one table',32,P.green);
  },{
    "idea": "Store state names in States and let employee rows refer to them by state code.",
    "builds": [
      "Point to the state table on the right: 26 maps to Michigan and 56 maps to Wyoming. The employee table now stores state codes without repeating state names.",
      "Follow the arrow from employee 1’s state_code 26 to the matching state row. Employees 2 and 3 both refer to 56, but they remain separate employees.",
      "Point to the highlighted Michigan row and read ‘State names live in one table.’ A correction to that state’s name would require one stored-row change."
    ],
    "question": "Does reaching 3NF mean state_code 56 can appear only once in Employees?",
    "answer": "No. Several employees can reference the same state; the state’s descriptive name is stored once in States.",
    "context": "Jobs and Assignments remain, giving four tables overall. The design reaches 3NF under the example’s stated keys and dependencies. Repeated foreign-key values intentionally represent relationships."
  }, '29',{activity:'normalization',minutes:3});

  exercise('normalization','Normalization',4,
    ['In 1NF, update one Alice #1 row.','Repeat the move in 3NF.'],
    'Why is Alice #3 unchanged?','26–29',
    {
    "idea": "Compare how many stored facts must change when the same employee moves in two designs.",
    "builds": [
      "Point to the green ↗ link and give students 4 minutes; reset the activity if it was used earlier. Ask them to update one Alice #1 assignment row in 1NF, switch to 3NF, and repeat the move. Return to the slides and ask why Alice #3 is unchanged."
    ],
    "question": "Why is Alice #3 unchanged when you move Alice #1?",
    "answer": "They have different employee IDs, and the update targets employee_id 1. In 3NF, one employee-row change supplies the new state to both of that employee’s joined assignments.",
    "context": "Switching normal forms resets the move. In 1NF, changing only one assignment row creates contradictory home states; in 3NF, the employee’s state code is stored once."
  });

  scene('Normalization tradeoffs',['Fewer repeated facts','Read workload','Measured denormalization'],(d,s)=>{
    title(d,'Normalization tradeoffs');
    const labels=[['Separate facts','Safer updates'],['Related tables','Joins at query time'],['Stored summary','Refresh responsibility']][s];flow(d,labels,0,255);
    text(d,'measure',640,450,s===2?'Measure queries and define consistency rules':'Integrity and performance require different checks',31,P.orange);
  },{
    "idea": "Normalization reduces update risks, while query speed must be measured for the workload.",
    "builds": [
      "Point from Separate facts to Safer updates. Connect this to Alice’s move: fewer stored copies mean fewer opportunities for inconsistent changes.",
      "Point from Related tables to Joins at query time. We can reconstruct the combined view, but its cost depends on the query, indexes, and data.",
      "Point from Stored summary to Refresh responsibility. A summary may speed up repeated reads, but someone must keep it consistent when the underlying facts change."
    ],
    "question": "What responsibility comes with storing a redundant summary to speed up reads?",
    "answer": "Define and maintain a refresh process so the summary stays consistent with the underlying data.",
    "context": "Normalization does not guarantee faster queries. Measure joins, indexes, caching, and workload before denormalizing. OLTP and OLAP describe useful workload tendencies, not universal rules for schema design."
  }, '30–31',{minutes:2,sources:['https://learn.microsoft.com/en-us/sql/relational-databases/performance/joins?view=sql-server-ver16']});

  scene('Structured Query Language',['A requested result','An execution plan'],(d,s)=>{
    code(d,'query',['SELECT name FROM employees','WHERE state_code = 26;'],100,245,36,60);
    if(s){box(d,'plan',420,400,440,90,'DBMS chooses a plan',true,P.green,32);}
  },{
    "idea": "SQL describes the requested data operation, and the DBMS chooses how to execute it.",
    "builds": [
      "Read the query aloud: return names from employees whose state_code is 26. Point to SELECT for the requested field and WHERE for the condition.",
      "Point to ‘DBMS chooses a plan.’ The query states the result we want; the database chooses an execution strategy for producing it."
    ],
    "question": "Does this SELECT specify which disk pages to read first?",
    "answer": "No. It specifies the desired rows and field; the DBMS chooses an execution plan.",
    "context": "The projected examples use MySQL, while the browser sandbox uses SQLite. SQL dialects differ in types, functions, and administration commands. Declarative SQL still needs suitable schemas, indexes, and queries for good performance."
  }, '32–33',{kind:'definition',term:'SQL',definition:'A language for defining database objects and querying or modifying relational data.',activity:'queries',minutes:2});

  scene('A database for the examples',['Create','Select'],(d,s)=>{
    title(d,'A database for the examples');code(d,'database',['CREATE DATABASE restaurant;','USE restaurant;'],100,225,39,90,s);
    if(s)text(d,'context',640,465,'Current database: restaurant',33,P.green);
  },{
    "idea": "Create the named MySQL database before selecting it as the session’s current database.",
    "builds": [
      "Read the highlighted CREATE DATABASE restaurant statement. It creates the named database in which we will define the example tables.",
      "Read USE restaurant and point to ‘Current database: restaurant.’ Unqualified table names in this session now refer to that database."
    ],
    "question": "What changes when the session executes USE restaurant?",
    "answer": "restaurant becomes the current database for resolving unqualified table names; USE does not create it.",
    "context": "These are MySQL commands, not SQLite sandbox commands. CREATE DATABASE requires permission and can fail if the name already exists. Use a disposable course database; semicolons delimit statements in common SQL clients."
  }, '34',{minutes:2,sources:[MYSQL+'create-database.html',MYSQL+'use.html']});

  scene('A table definition',['Columns and types','The primary key'],(d,s)=>{
    title(d,'A table definition');code(d,'create',['CREATE TABLE employees (','    employee_id INT PRIMARY KEY,','    name VARCHAR(50) NOT NULL,','    state_code INT',');'],100,190,33,62,s?1:2);
  },{
    "idea": "CREATE TABLE declares columns, data types, and constraints for future rows.",
    "builds": [
      "Point to the name declaration: VARCHAR(50) permits text up to 50 characters, and NOT NULL requires a non-NULL value. Read the two INT columns as numeric identifiers.",
      "Point to employee_id INT PRIMARY KEY. In this MySQL definition, the primary key requires a unique, non-NULL identifier for each employee."
    ],
    "question": "Does this definition make employee names unique?",
    "answer": "No. The primary key is employee_id; the name column has no uniqueness constraint.",
    "context": "This short definition does not yet declare state_code as a foreign key, and state_code permits NULL. NOT NULL alone does not reject an empty string. State codes are identifiers, not quantities to add."
  }, '34',{activity:'keys',minutes:2,sources:[MYSQL+'create-table.html']});

  scene('INSERT creates rows',['Explicit columns','One record','A second employee'],(d,s)=>{
    title(d,'INSERT creates rows');code(d,'insert',['INSERT INTO employees','    (employee_id, name, state_code)',s===2?"VALUES (2, 'Bob', 56);":"VALUES (1, 'Alice', 26);"],90,185,34,61,s===0?1:2);
    if(s>=1)table(d,'created',370,405,[160,220,160],[['id','name','state'],s===2?EMPLOYEES[1]:EMPLOYEES[0]],{rowHeight:53,fontSize:30});
  },{
    "idea": "INSERT maps a list of values to an explicit list of destination columns.",
    "builds": [
      "Point to the column list and align it with VALUES: employee_id receives 1, name receives 'Alice', and state_code receives 26. The positions establish the mapping.",
      "Point to the new row beneath the statement. Read its three stored values and connect each one back to the matching input value.",
      "Read the changed VALUES clause: 2, 'Bob', 56. Point to Bob’s new row; this insert adds another employee rather than replacing Alice."
    ],
    "question": "Which column receives 56 in the second INSERT?",
    "answer": "state_code, because it is third in the explicit column list and 56 is third in VALUES.",
    "context": "Use straight single quotes for SQL text. Duplicate keys or violated constraints can reject an insert. Later examples use a complete three-row fixture that also includes employee 3, the distinct Alice in state 56."
  }, '34',{activity:'queries',minutes:2,sources:[MYSQL+'insert.html']});

  scene('SELECT reads rows',['Source rows','Filter','Selected columns'],(d,s)=>{
    title(d,'SELECT reads rows');code(d,'select',["SELECT employee_id, name","FROM employees","WHERE name = 'Alice';"],80,160,32,45,s===0?1:s===1?2:0);
    table(d,'selection',300,340,[300,350],[['employee_id','name'],...(s===0?EMPLOYEES:EMPLOYEES.filter(r=>r[1]==='Alice')).map(r=>r.slice(0,2))],{rowHeight:51,fontSize:31,highlightRows:s===1?[1,2]:[]});
  },{
    "idea": "SELECT chooses output fields from rows that satisfy a condition.",
    "builds": [
      "Point to the highlighted FROM employees line and read the three source rows. Both employee 1 and employee 3 have the name Alice.",
      "Point to WHERE name = 'Alice' and the two remaining rows. Bob is excluded, while both distinct Alice employees satisfy the condition.",
      "Point to the highlighted SELECT employee_id, name line. These are the two fields returned for each matching row."
    ],
    "question": "Why does this query return two rows instead of one?",
    "answer": "Employees 1 and 3 both have name = 'Alice'; the condition does not select a unique employee ID.",
    "context": "This is a conceptual explanation of FROM, WHERE, and SELECT, not a physical execution plan. Without ORDER BY, the query does not guarantee the displayed row order. SELECT * would request all columns."
  }, '34',{activity:'queries',minutes:3,sources:[MYSQL+'select.html']});

  scene('AND and OR filters',['AND','OR','Explicit grouping'],(d,s)=>{
    title(d,'AND and OR filters');const condition=s===0?"name = 'Alice' AND state_code = 56":s===1?"name = 'Alice' OR state_code = 56":"(name = 'Alice' OR name = 'Bob')";
    code(d,'filter',['SELECT employee_id FROM employees','WHERE '+condition+(s===2?'':';'),...(s===2?['  AND state_code = 56;']:[])],75,180,30,62);
    text(d,'result',640,465,s===0?'Matches: 3':s===1?'Matches: 1, 2, 3':'Matches: 2, 3',36,P.green);
  },{
    "idea": "AND requires both conditions, while OR allows either condition to match.",
    "builds": [
      "Read the AND condition and point to Matches: 3. Employee 3 is both named Alice and in state 56; employee 1 fails the state test.",
      "Read the OR condition and point to Matches: 1, 2, 3. The two Alices pass the name test, and Bob passes the state test.",
      "Read the parenthesized name condition first, then the AND state condition. Employees 2 and 3 match a listed name and live in state 56."
    ],
    "question": "Which employees satisfy the final grouped condition?",
    "answer": "Employee 2, Bob, and employee 3, Alice; both have state_code 56 and one of the listed names.",
    "context": "AND has higher precedence than OR, but parentheses make the intended grouping explicit. WHERE retains only TRUE predicates; FALSE and UNKNOWN are excluded. Test missing values with IS NULL rather than = NULL."
  }, '36',{activity:'queries',minutes:3,sources:[MYSQL+'operator-precedence.html',MYSQL+'working-with-null.html']});

  scene('Ordering and limiting',['An explicit order','The first two rows'],(d,s)=>{
    title(d,'Ordering and limiting');code(d,'limit',['SELECT employee_id, name','FROM employees','ORDER BY employee_id','LIMIT 2;'],95,165,32,46,s?3:2);
    table(d,'limited',330,330,[280,340],[['employee_id','name'],...EMPLOYEES.slice(0,s?2:3).map(r=>r.slice(0,2))],{rowHeight:50,fontSize:29});
  },{
    "idea": "ORDER BY defines the sequence, and LIMIT keeps the requested number of rows from it.",
    "builds": [
      "Point to ORDER BY employee_id and read the displayed order: 1, 2, 3. The unique identifier makes this ordering unambiguous.",
      "Point to LIMIT 2 and count the remaining rows. The ordered result keeps employee 1 and employee 2, then stops."
    ],
    "question": "Would LIMIT 2 alone guarantee employees 1 and 2?",
    "answer": "No. Without an explicit ordering, the database does not promise which two rows will be returned.",
    "context": "For predictable subsets, include a unique tie-breaker in ORDER BY. This LIMIT syntax works in MySQL and SQLite, while other products may use different syntax."
  }, '36',{activity:'queries',minutes:2,sources:[MYSQL+'limit-optimization.html']});

  scene('JOIN across tables',['Read the query','See both input tables','Reject a nonmatching pair','Match Alice 1 to Michigan','Copy the first result row','Match Bob to Wyoming','Copy the second result row','Match Alice 3 to Wyoming','Copy the third result row'],(d,s)=>{
    title(d,'JOIN across tables');
    if(s===0){
      code(d,'join',['SELECT e.employee_id, e.name, s.home_state','FROM employees AS e','JOIN states AS s','  ON e.state_code = s.state_code','ORDER BY e.employee_id;'],75,190,30,52,3);
      return;
    }
    const active=s>=3?Math.floor((s-3)/2):-1;
    const pending=s>=3&&s%2===1;
    const emitted=s>=3?Math.floor((s-2)/2):0;
    const employeeIndex=s===2?0:active;
    const stateIndex=s===2?1:active<0?-1:STATES.findIndex(row=>row[0]===EMPLOYEES[active][2]);
    const rowY=index=>205+(index+1.5)*48;
    const resultRows=EMPLOYEES.slice(0,emitted).map(row=>[row[0],row[1],STATES.find(state=>state[0]===row[2])[1]]);
    text(d,'join-condition',640,130,'ON e.state_code = s.state_code',27,P.green);
    text(d,'join-employees-label',320,175,'Employees',30);
    text(d,'join-states-label',1000,175,'States',30);
    table(d,'join-employees',65,205,[190,140,180],[['employee_id','name','state_code'],...EMPLOYEES],{rowHeight:48,fontSize:27,highlightRows:employeeIndex<0?[]:[employeeIndex+1]});
    table(d,'join-states',795,205,[170,240],[['state_code','home_state'],...STATES],{rowHeight:48,fontSize:27,highlightRows:stateIndex<0?[]:[stateIndex+1]});
    if(employeeIndex>=0){
      const color=s===2?P.red:P.green;
      d.rect('join-employee-key',395,rowY(employeeIndex)-24,180,48,'none',color,0,3);
      d.rect('join-state-key',795,rowY(stateIndex)-24,170,48,'none',color,0,3);
      d.arrow('join-match',590,rowY(employeeIndex),780,rowY(stateIndex),color,3);
      text(d,'join-comparison',685,230,s===2?'26 ≠ 56':EMPLOYEES[employeeIndex][2]+' = '+STATES[stateIndex][0],27,color);
    }
    text(d,'join-result-label',180,474,'Result',31,P.green);
    if(s===2)text(d,'join-no-match',180,519,'No row added',27,P.red);
    if(s===8)text(d,'join-complete',180,519,'3 matches',27,P.green);
    table(d,'join-result',350,450,[190,150,260],[['employee_id','name','home_state'],...resultRows],{rowHeight:48,fontSize:27});

    // Stable copy keys move selected values from their source cells into the result.
    // Keep the source rows intact; a state can match more than one employee.
    const replaced=new Set();
    for(let row=1;row<=emitted;row++)for(let col=0;col<3;col++)replaced.add(`join-result-${row}-${col}-text`);
    if(pending){
      replaced.add(`join-employees-${active+1}-0-text`);
      replaced.add(`join-employees-${active+1}-1-text`);
      replaced.add(`join-states-${stateIndex+1}-1-text`);
    }
    d.items=d.items.filter(item=>!replaced.has(item.key));
    for(let row=0;row<=active;row++){
      const employee=EMPLOYEES[row],state=STATES.findIndex(value=>value[0]===employee[2]);
      const staged=pending&&row===active,resultY=450+(row+1.5)*48;
      const values=[employee[0],employee[1],STATES[state][1]];
      const sourceX=[160,325,1085],resultX=[445,615,820];
      values.forEach((value,col)=>d.text(`join-copy-${row}-${col}`,staged?sourceX[col]:resultX[col],staged?rowY(col===2?state:row):resultY,value,27,col===2?P.green:P.blue,'middle',450));
    }
  },{
    "idea": "A join combines related rows using an explicit matching condition.",
    "builds": [
      "Point to ON e.state_code = s.state_code. Explain that e means Employees and s means States. We select the employee’s ID and name plus the matching state’s name, then order the result by employee ID.",
      "Point to the two input tables and the empty Result header. Ask students to find the shared state_code column before advancing. Both Alice rows have different employee IDs.",
      "Point to employee 1’s code 26 and Wyoming’s code 56. The codes differ, so this pair adds no result row. Alice can still match a different States row.",
      "Follow the arrow from employee 1 to Michigan. Both codes are 26. Point to the colored ID, employee name, and state name; these are the values we will copy into the result.",
      "Follow the colored values into the first result row: 1, Alice, Michigan. The ID and name came from Employees, and Michigan came from States. Both input rows remain available.",
      "Point to Bob’s code 56 and Wyoming’s code 56. Ask students to predict the next result row before advancing.",
      "Follow 2, Bob, and Wyoming into the second result row. We add a row for this matching pair and keep the first result row.",
      "Point to employee 3, the other Alice, and follow code 56 to the same Wyoming row. Explain that a matched state row remains available for other employees.",
      "Follow 3, Alice, and Wyoming into the third result row. Count the three matching pairs and point out that Wyoming appears twice because two employees matched it."
    ],
    "question": "Why does Wyoming appear in two result rows?",
    "answer": "Bob, employee 2, and Alice, employee 3, both have state_code 56, so each matches the Wyoming row.",
    "context": "This animation illustrates matching pairs and copying selected fields, not the database’s physical execution algorithm. The failed comparison rejects only that pair. Input rows are not consumed or changed. ORDER BY e.employee_id specifies the displayed result order. This is an inner join: an employee with no matching state would be absent; a LEFT JOIN could retain that employee. Here each employee matches one state because state_code is unique in States; other joins can produce different numbers of rows. Use Right or Space to advance, A to play, and R to replay."
  }, '36',{activity:'queries',minutes:3,sources:[MYSQL+'join.html']});

  scene('UPDATE changes matching rows',['Preview the target','Update by identifier','The result'],(d,s)=>{
    title(d,'UPDATE changes matching rows');
    code(d,'update',s?['UPDATE employees','SET state_code = 56','WHERE employee_id = 1;']:['SELECT * FROM employees','WHERE employee_id = 1;'],95,180,34,61,s?2:1);
    if(s===2)employeeTable(d,'changed',365,385,[['1','Alice','56']],[1]);
  },{
    "idea": "Preview the target and update by its identifier when only one employee should change.",
    "builds": [
      "Read the preview SELECT and point to WHERE employee_id = 1. Ask which person it targets before making any change.",
      "Read SET state_code = 56, then point to the same employee_id predicate. The update moves Alice 1 to Wyoming without targeting Alice 3.",
      "Point to the result row: employee 1, Alice, state 56. Confirm that the employee’s identity remains the same while the state value changes."
    ],
    "question": "Why use employee_id = 1 instead of name = 'Alice' for this move?",
    "answer": "The name condition matches both Alice employees, while employee_id 1 identifies only the intended person.",
    "context": "Without WHERE, UPDATE can affect every row. A referenced destination state must exist when a foreign key requires it. Within an explicit transaction, commit the successful change or roll it back before committing."
  }, '34',{activity:'queries',minutes:3,sources:[MYSQL+'update.html']});

  scene('DELETE removes matching rows',['Preview assignments','Delete child rows','Delete the employee and commit'],(d,s)=>{
    title(d,'DELETE removes matching rows');
    const lines=s===0?['SELECT * FROM employee_jobs','WHERE employee_id = 2;']:s===1?['BEGIN;','DELETE FROM employee_jobs','WHERE employee_id = 2;']:['DELETE FROM employees','WHERE employee_id = 2;','COMMIT;'];
    code(d,'delete',lines,95,170,34,56,s===0?1:s===1?1:0);
    if(s===0)table(d,'dependencies',360,345,[260,260],[['employee_id','job_code'],['2','J02'],['2','J03']],{rowHeight:53,fontSize:29});
    if(s===2)table(d,'remaining',335,345,[280,320],[['employee_id','name'],['1','Alice'],['3','Alice']],{rowHeight:53,fontSize:30});
  },{
    "idea": "Remove an employee’s referencing assignments before deleting that employee, within one transaction.",
    "builds": [
      "Read the preview SELECT from employee_jobs for employee_id 2. Point to the J02 and J03 rows: these are the two child assignments that currently reference Bob.",
      "Read BEGIN, then DELETE FROM employee_jobs WHERE employee_id = 2. The transaction removes those referencing child rows first; Bob’s employee row has not yet been deleted.",
      "Continue the same transaction with DELETE FROM employees WHERE employee_id = 2, then COMMIT. Point to the remaining employee IDs 1 and 3: the two distinct Alices remain."
    ],
    "question": "Why delete from employee_jobs before deleting employee 2?",
    "answer": "The restrictive foreign key rejects deleting Bob while assignment rows still reference him. Removing those child rows first allows the parent deletion.",
    "context": "The statements continue across builds as one transaction; issue ROLLBACK if the operation fails. An ON DELETE CASCADE relationship would behave differently. DELETE preserves the table definition, and omitting WHERE can remove every row."
  }, '34, 36',{activity:'queries',minutes:3,sources:[MYSQL+'delete.html',MYSQL+'create-table-foreign-keys.html',MYSQL+'commit.html']});

  scene('Schema inspection and DROP',['Inspect the structure','Remove the table'],(d,s)=>{
    title(d,'Schema inspection and DROP');
    code(d,'ddl',s?['DROP TABLE scratch_employees;']:['DESCRIBE employees;'],95,220,39);
    text(d,'effect',640,390,s?'Definition and stored rows are removed':'Columns, types, nullability, and keys',34,s?P.orange:P.green);
    if(s)text(d,'scope',640,490,'Use a disposable example table',30,P.muted);
  },{
    "idea": "Inspecting a table and removing a table are different operations.",
    "builds": [
      "Read DESCRIBE employees. Point to the information it reports: column names, types, nullability, and keys. This MySQL command inspects the definition without changing the rows.",
      "Read DROP TABLE scratch_employees. Both the table definition and its stored rows disappear. Use a disposable scratch table for this demonstration."
    ],
    "question": "How does DROP TABLE differ from DELETE?",
    "answer": "DELETE removes selected rows and leaves the table definition. DROP TABLE removes the table itself and all its rows.",
    "context": "Many MySQL DDL statements cause implicit commits, so do not use DROP to demonstrate ordinary transaction rollback. DROP DATABASE removes a database and its objects. The SQLite playground uses its schema panel or PRAGMA table_info instead of MySQL DESCRIBE."
  }, '36',{minutes:2,sources:[MYSQL+'describe.html',MYSQL+'drop-table.html',MYSQL+'implicit-commit.html']});

  scene('SQL prediction practice',['Predict','Run','Explain'],(d,s)=>{
    title(d,'SQL prediction practice');code(d,'question',["SELECT employee_id FROM employees","WHERE name = 'Alice'","ORDER BY employee_id LIMIT 1;"],90,195,31,67);
    text(d,'answer',640,465,s===0?'Which identifier appears?':s===1?'1':'The name matches two rows; ordering selects one.',s===2?29:38,s?P.green:P.ink);
  },{
    "idea": "A filter finds matching rows, and ordering determines which row LIMIT keeps.",
    "builds": [
      "Read the query aloud. Ask students which employee identifier it returns, and give them time to explain a prediction before advancing.",
      "Reveal employee_id 1. Run the query on the original three-employee dataset to check the prediction.",
      "Trace the clauses in order: the name matches employees 1 and 3, ORDER BY puts 1 first, and LIMIT keeps one row. Both employees named Alice are valid records."
    ],
    "question": "What would this query return if we removed LIMIT 1?",
    "answer": "It would return employee IDs 1 and 3 in that order. The WHERE condition matches both Alices.",
    "context": "Reset the playground before using the original dataset. Change one clause at a time so students can connect each change to its result."
  }, '35',{kind:'activity',activity:'queries',minutes:4});

  exercise('queries','SQL query playground',4,
    ['Run JOIN, then add before ORDER BY:','WHERE e.employee_id = 1'],
    'Why does one employee produce two rows?','35–36',
    {
    "idea": "A join can return several rows for one employee when that employee has several assignments.",
    "builds": [
      "Open the green ↗ link and reset the activity if it was used earlier. Give students 4 minutes to run Relate · JOIN, add WHERE e.employee_id = 1 before ORDER BY, predict the result, and run again. Bring the class back to explain why one employee produces two rows."
    ],
    "question": "Why does the filtered join still return two rows?",
    "answer": "Employee 1 has two job assignments: Chef and Waiter. Each matching assignment contributes a result row.",
    "context": "The activity runs SQLite locally and needs no database credentials. The WHERE clause belongs after the JOIN clauses and before ORDER BY."
  });

  scene('Python and the database',['A driver','SQL and values','Rows back to Python'],(d,s)=>{
    title(d,'Python and the database');flow(d,['Python','Connector','MySQL'],s,260);
    text(d,'library',640,190,'mysql-connector-python',32,P.green);
    if(s>=1)text(d,'payload',640,450,s===1?'SQL statement + parameters':'Rows become Python values',33,P.blue);
  },{
    "idea": "A database driver carries requests and results between Python and MySQL.",
    "builds": [
      "Follow the path from Python through Connector to MySQL. Name mysql-connector-python as the driver used in these examples.",
      "Point to SQL statement + parameters. Python gives the driver a statement and its separate values, and the driver communicates the request to MySQL.",
      "Follow the result back to Python. The driver makes the returned rows available as Python values that the program can read and use."
    ],
    "question": "Does importing the driver open a database connection?",
    "answer": "No. Importing makes the library available; the program must call its connection API with the database configuration.",
    "context": "Other drivers have their own APIs and parameter conventions. An ORM adds object-to-table mapping above this communication layer. The next snippets show parts of one workflow; the companion contains a complete runnable example."
  }, '37–38',{minutes:2,sources:[CONNECTOR+'connector-python-introduction.html']});

  scene('Connection configuration',['Configuration from the environment','Open the connection'],(d,s)=>{
    title(d,'Connection configuration');code(d,'connect',['import os','import mysql.connector','conn = mysql.connector.connect(','    host=os.environ["DB_HOST"],','    user=os.environ["DB_USER"],','    password=os.environ["DB_PASSWORD"],','    database=os.environ["DB_NAME"]',')'],90,168,29,45,s?2:5);
  },{
    "idea": "The program reads connection settings from its environment before opening the database connection.",
    "builds": [
      "Point to DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME. These names identify environment variables that the Python code reads with os.environ. Keep the password value off the projector.",
      "Point to mysql.connector.connect. The supplied settings identify the server, account, and database to use. A missing required environment variable raises an error before that connection can open."
    ],
    "question": "Does MySQL Connector automatically discover variables named DB_HOST and DB_PASSWORD?",
    "answer": "No. Our Python code reads those variables and passes their values to connect. The variable names are a choice made by this application.",
    "context": "Use the course configuration and required TLS settings. The correct port, network path, server trust, and permissions are also needed. Environment variables keep credentials out of this source file, but are not a complete secret-management system; files containing passwords must stay out of the repository."
  }, '39',{minutes:3,sources:[CONNECTOR+'connector-python-connectargs.html']});

  scene('A parameterized query',['The statement','Separate values','Dictionary rows'],(d,s)=>{
    title(d,'A parameterized query');
    const lines=s===2?['for row in cursor.fetchall():','    print(row["employee_id"], row["name"])']:['cursor = conn.cursor(dictionary=True)','sql = "SELECT employee_id, name FROM employees"','sql += " WHERE state_code = %s"','cursor.execute(sql, (26,))'];
    code(d,'parameters',lines,80,200,30,68,s===0?2:s===1?3:1);
    if(s===2)text(d,'result',640,440,'1  Alice',35,P.green);
  },{
    "idea": "Parameter binding keeps a query's values separate from its SQL structure.",
    "builds": [
      "Read the SELECT statement and point to %s. It marks the value used to filter state_code. Leave the placeholder unquoted in the SQL string.",
      "Point to cursor.execute(sql, (26,)). The driver binds 26 to the placeholder; the comma makes (26,) a one-element tuple. Do not use Python string formatting to insert user values into SQL.",
      "Read the loop over fetchall. Because the cursor uses dictionary=True, each row can be read by column name. In the original dataset, state 26 returns employee 1, Alice."
    ],
    "question": "How would we query state 56 using the same SQL statement?",
    "answer": "Pass (56,) as the parameter tuple. The SQL text and its %s placeholder stay the same.",
    "context": "Connector/Python uses %s placeholders; Python sqlite3 uses ?. Binding supplies values, not arbitrary table names or SQL clauses. Validate dynamic identifiers separately. fetchall is convenient for this small result but can consume substantial memory for large results."
  }, '39',{activity:'queries',minutes:3,sources:[CONNECTOR+'connector-python-api-mysqlcursor-execute.html',CONNECTOR+'connector-python-api-mysqlcursor-fetchall.html']});

  scene('Commit or roll back',['A pending write','Successful completion','An exception'],(d,s)=>{
    title(d,'Commit or roll back');code(d,'write',['try:','    cursor.execute(sql, params)','    conn.commit()','except mysql.connector.Error:','    conn.rollback()','    raise'],95,180,32,56,s===0?1:s===1?2:4);
  },{
    "idea": "The application commits successful writes and attempts to roll back a failed transaction.",
    "builds": [
      "Point to cursor.execute(sql, params). Here sql is a prepared INSERT, UPDATE, or DELETE, and params supplies its values. With Connector/Python's default autocommit setting, the transactional write still needs a commit.",
      "Advance to conn.commit(). This ends the successful transaction and commits its changes. All writes belonging to the same unit of work should succeed before this call.",
      "Follow the exception path to conn.rollback() and raise. If execution or commit raises a connector error, the application attempts to abandon the transaction and passes the error back to its caller."
    ],
    "question": "Does a SQL error always roll back the entire transaction automatically?",
    "answer": "No. Error behavior depends on the database and error; this application explicitly calls rollback to abandon the transaction.",
    "context": "This pattern assumes a transactional engine such as InnoDB and does not make MySQL DDL rollbackable. A lost connection during commit can leave the outcome uncertain; blindly repeating a write may apply it twice. Resource cleanup follows separately."
  }, '39',{activity:'transactions',minutes:3,sources:[CONNECTOR+'connector-python-api-mysqlconnection-commit.html',CONNECTOR+'connector-python-api-mysqlconnection-rollback.html']});

  scene('Reliable cleanup',['A successful run','A failed run','Release resources'],(d,s)=>{
    title(d,'Reliable cleanup');
    if(s<2){flow(d,s?['Connect','Failure','Cleanup']:['Connect','Query','Cleanup'],s?1:2,265);text(d,'guarantee',640,455,'Cleanup belongs on both paths',34,P.green);}
    else code(d,'cleanup',['finally:','    try:','        if cursor is not None:','            cursor.close()','    finally:','        if conn is not None:','            conn.close()'],90,175,31,48);
  },{
    "idea": "Database resources need cleanup on both successful and failed runs.",
    "builds": [
      "Follow Connect, Query, Cleanup. After using the results, close the cursor and then the connection so the program releases its resources.",
      "Follow Connect, Failure, Cleanup. A failed query still leaves resources to release. Put cleanup in finally so the error path reaches it too.",
      "Read the two finally blocks. Close the cursor if it was created, then close the connection even if closing the cursor raises an error. Initialize both variables to None before the surrounding try."
    ],
    "question": "Why is connection cleanup inside a second finally block?",
    "answer": "It ensures that a cursor-close error cannot skip the attempt to close the connection.",
    "context": "This fragment belongs inside the complete connection and transaction workflow. Connector/Python's connection and cursor context managers close resources; leaving them does not automatically commit. Fetch or handle pending results according to the driver's rules."
  }, '39',{minutes:2,sources:[CONNECTOR+'connector-python-api-mysqlcursor-close.html',CONNECTOR+'connector-python-api-mysqlconnection-close.html']});

  scene('First meeting handoff',['Review','Next practice'],(d,s)=>{
    title(d,'First meeting handoff');text(d,'review',640,210,'Restaurant normalization',40,P.green);text(d,'deadline',640,310,'Lab 03 · September 23',35,P.orange);
    if(s)text(d,'next',640,440,'Next: schema design and SQL with Python',34);
  },{
    "idea": "Review the restaurant design before using SQL and Python in the next meeting.",
    "builds": [
      "Ask students to trace the restaurant tables from repeated assignments to separate employee, job, and state facts. Point to the Lab 03: Scripting reminder for September 23.",
      "Preview schema design and SQL with Python. Ask students to bring one question about keys, normalization, or query results to the next meeting."
    ],
    "question": "Where should the state name live in our final restaurant design?",
    "answer": "In States, identified by state_code. Employees stores the state code and uses a join to obtain the name.",
    "context": "For the September 22 meeting, the listed Lab 03 deadline is September 23. Canvas has the current deadline and the Week 05 database video, relational reading, and MySQL cheatsheet. Use the cloud and network slides as preparation if class time permits."
  }, '40–41',{kind:'recap',minutes:1});

  scene('Managed cloud databases',['Provider examples','Service and engine','Shared responsibilities'],(d,s)=>{
    title(d,'Managed cloud databases');
    if(!s)table(d,'cloud',120,190,[260,390,390],[['Provider','Relational examples','Other examples'],['AWS','RDS / Aurora','DynamoDB'],['Google','Cloud SQL / Spanner','Firestore'],['Microsoft','Azure SQL','Cosmos DB']],{rowHeight:74,fontSize:27});
    if(s===1){flow(d,['Managed service','Database engine','Your schema'],1,260);text(d,'aurora',640,455,'Aurora: MySQL/PostgreSQL-compatible service',30,P.green);}
    if(s===2){text(d,'provider',330,235,'Provider',38,P.blue);text(d,'user',940,235,'Your team',38,P.green);text(d,'operations',330,365,'Service operations',31);text(d,'data',940,365,'Data, access, queries',31);}
  },{
    "idea": "A managed service handles database operations while the application team still makes data and access decisions.",
    "builds": [
      "Compare the provider rows. AWS, Google, and Microsoft offer services for different data models and workloads. Treat these names as examples, then ask what the application needs to store and query.",
      "Follow Managed service, Database engine, Your schema. Aurora is an AWS managed service with MySQL and PostgreSQL compatibility. Amazon RDS manages several supported database engines.",
      "Point to the two responsibilities. The provider operates the service, while your team chooses the schema, permissions, queries, and application behavior. Discuss who must select suitable backup and recovery settings."
    ],
    "question": "Does choosing a managed database remove the need to design keys and permissions?",
    "answer": "No. The application team still defines its data relationships and decides who may access or change them.",
    "context": "Products differ in features and compatibility. Open-source software still has a license, and managed services may incur charges. Aurora should not be described as an open-source, license-free engine. Oracle and SQL Server licensing options depend on edition and service."
  }, '42–44',{minutes:3,sources:['https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html','https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html','https://cloud.google.com/products/databases','https://azure.microsoft.com/en-us/products/category/databases/']});

  scene('Database network connections',['The destination','The service port','Access checks'],(d,s)=>{
    title(d,'Database network connections');box(d,'client',110,260,300,120,'Client',true,P.blue,38);box(d,'server',850,260,320,120,'MySQL server',true,P.green,33);
    d.arrow('connection',430,320,830,320,s===2?P.orange:P.green,5);
    text(d,'destination',640,190,s?'host:3306':'database hostname',35,P.green);
    if(s>=1)text(d,'port',640,425,'TCP port 3306',31,P.blue);
    if(s===2)text(d,'checks',640,510,'Route · firewall · TLS · authentication',30,P.orange);
  },{
    "idea": "A connection needs the right destination, service port, and access configuration.",
    "builds": [
      "Point from the client to the database hostname. The hostname identifies the destination server; it does not specify which service to contact there.",
      "Read host:3306. MySQL commonly listens on TCP port 3306, so the client needs both the host and the configured port. A server can use a different port.",
      "Trace the access checks: route, firewall, TLS, and authentication. Being able to reach a server does not prove that its certificate is trusted or that the account may use the database."
    ],
    "question": "Does a correct password guarantee a connection will succeed?",
    "answer": "No. The client also needs a reachable host and port, permitted network access, and the required TLS configuration.",
    "context": "Use the course endpoint and approved network path. Common ports include PostgreSQL 5432, Redis 6379, MongoDB 27017, SSH 22, and HTTP/HTTPS 80/443. Oracle commonly uses TCP 1521; SQL Server commonly uses TCP 1433, while SQL Server Browser uses UDP 1434. Avoid opening database access to every internet address."
  }, '45',{minutes:3,sources:['https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToInstance.html','https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-a-windows-firewall-for-database-engine-access?view=sql-server-ver17']});

  scene('Schema and SQL practice',['The second meeting','Today’s work'],(d,s)=>{
    title(d,'Schema and SQL practice');text(d,'date',640,205,'September 24, 2026',34,P.muted);
    flow(d,['Design','Query','Load'],s?1:0,335);
  },{
    "idea": "Today's work connects schema design, SQL queries, and loading data.",
    "builds": [
      "Welcome students to the September 24 meeting. Collect remaining questions from the first session and point to Design as the starting point for today's work.",
      "Follow Design, Query, Load. Preview the social application schema, the course repository update, the Python demonstration, and the data engineering exercise."
    ],
    "question": "Why decide on keys before writing the data-loading script?",
    "answer": "The script needs a consistent way to identify records, link related rows, and handle repeated input.",
    "context": "Use the current course configuration for MySQL connections. The linked browser activities run without database credentials and can support students while a course connection is being configured."
  }, '46–47',{kind:'title',minutes:1});

  scene('A social application schema',['One wide table','Separate people and posts','The relationship'],(d,s)=>{
    title(d,'A social application schema');
    if(!s)table(d,'wide',120,205,[180,290,440],[['name','email','message'],['Mary','mary@example.com','I dislike snow.'],['Mary','mary@example.com','More snow today.']],{rowHeight:82,fontSize:29,highlightCols:[0,1]});
    else{table(d,'users',90,230,[140,220],[['user_id','name'],['1','Mary'],['2','Peter']],{rowHeight:65,fontSize:30});table(d,'posts',735,230,[140,140,200],[['post_id','user_id','message'],['10','1','Snow!'],['11','1','More snow.']],{rowHeight:65,fontSize:27});if(s===2)d.arrow('author',470,328,715,328,P.green,4);}
  },{
    "idea": "Separate user facts from post facts and connect them with a user identifier.",
    "builds": [
      "Point to Mary's repeated name and email in the wide table. Give groups time to propose user and post fields, and ask what would need updating if Mary's email changed.",
      "Reveal Users and Posts. Mary and Peter each have a user_id, while each post has its own post_id. Add fields such as email and timestamps when discussing the group's design.",
      "Follow user_id 1 from both posts back to Mary. The two posts belong to one user, so a foreign key can check that their author exists. Ask groups to explain their relationship and assumptions."
    ],
    "question": "Why should a post refer to user_id rather than the author's display name?",
    "answer": "A display name may repeat or change. A stable, unique user_id identifies the intended user even when the name changes.",
    "context": "Allow about ten minutes for group design and discussion across these builds. Email uniqueness, deletion behavior, optional profiles, and multiple authors require explicit domain decisions. The pictured design assumes each post has one author."
  }, '48',{kind:'activity',activity:'keys',minutes:10});

  scene('Updating the course fork',['Inspect and save work','Bring upstream changes','Publish your fork'],(d,s)=>{
    title(d,'Updating the course fork');
    const lines=[['git status','git remote -v'],['git switch main','git fetch upstream','git merge upstream/main'],['git push origin main']][s];code(d,'git',lines,100,220,35,75);
    if(!s)text(d,'save',640,435,'Save your changes before switching branches',31,P.orange);
  },{
    "idea": "Bring instructor changes into the local repository, then publish the updated branch to the student's fork.",
    "builds": [
      "Read git status and git remote -v. Have students preserve their current work before switching branches. Check that origin points to their fork and upstream to the instructor repository.",
      "Follow the three commands: switch to main, fetch upstream history, then merge upstream/main. Fetch downloads the commits; merge integrates them into the current branch. Resolve any merge conflicts before continuing.",
      "Read git push origin main. This publishes the updated local main branch to the student's fork. Confirm that the merge and local checks have finished first."
    ],
    "question": "Does git fetch upstream change the files on the current branch by itself?",
    "answer": "No. It downloads upstream history and updates remote-tracking references. The merge step integrates that history into the current branch.",
    "context": "Use the repository and branch names configured for this course. A merge can fast-forward or create a merge commit; an additional blanket commit is not always needed. These commands are instructions for the student's terminal."
  }, '49',{kind:'activity',minutes:3,sources:['https://git-scm.com/docs/git-fetch','https://git-scm.com/docs/git-merge']});

  scene('SQL with Python demo',['Configure','Query','Explain the result'],(d,s)=>{
    title(d,'SQL with Python demo');flow(d,['Environment','Connector','Rows'],s,275);
    text(d,'question',640,190,['Which database will this reach?','Which values are parameters?','What happens if the query fails?'][s],35);
    text(d,'demo',640,465,'Course demo: SQL with Python',30,P.green);
  },{
    "idea": "Trace one Python query from connection settings to returned rows and cleanup.",
    "builds": [
      "Open the course Python example and identify its host, database, and user. Ask which database this configuration reaches without displaying the password.",
      "Run a SELECT and point to the SQL statement and its separate parameters. Have students predict which rows the parameter values should select before inspecting the output.",
      "Use a controlled invalid query to follow the error path. Show where the error is reported and where resources close. For a failed transactional write, also identify the application's rollback path."
    ],
    "question": "Which part of the example should change when we want to filter for a different state?",
    "answer": "Change the bound state value. Keep the SQL placeholder and the code that passes parameters separately.",
    "context": "Use the complete companion example and current course connection instructions. Driver error handling, transaction decisions, and resource cleanup serve different purposes; trace each in the relevant code."
  }, '50',{kind:'activity',activity:'queries',minutes:5});

  scene('ETL into related tables',['Extract JSON','Transform and validate','Load relationships'],(d,s)=>{
    title(d,'ETL into related tables');flow(d,['JSON','Python','SQL database'],s,225);
    if(s>=1)text(d,'transform',640,510,'Parse · validate · assign stable keys',30,P.green);
    if(s===2){box(d,'users',875,395,145,80,'Users',true,P.blue,27);box(d,'posts',1040,395,145,80,'Posts',true,P.green,27);}
  },{
    "idea": "An ETL script validates source records before loading rows and their relationships.",
    "builds": [
      "Follow JSON to Python to the SQL database. Name the three stages: extract the records, transform them, and load the resulting rows.",
      "Point to Parse, validate, assign stable keys. Check required fields, types, and identifiers before constructing database writes. Decide what to do with invalid records and repeated input.",
      "Reveal Users and Posts. Load a user before a post that references that user, and pass values as bound parameters. Group related writes in a transaction so the application can roll back the chosen batch if loading fails."
    ],
    "question": "Why load a new user before a post that references that user?",
    "answer": "The post's foreign key needs a matching user row. Loading the post first would fail when that constraint is enforced.",
    "context": "Choose the batch boundary and repeated-load policy explicitly. The browser exercise uses employee records and an existing state lookup to demonstrate validation, bound values, and atomic batch loading."
  }, '51',{activity:'etl',minutes:4});

  exercise('etl','JSON → SQL',4,
    ['Inspect rejected records. Load the sample twice.'],
    'Why are only two rows stored?','51',
    {
    "idea": "Validation selects acceptable records, and a transaction controls whether a load is kept.",
    "builds": [
      "Open the green ↗ link and reset the activity if it was used earlier. Give students 4 minutes to inspect the accepted preview and rejected records, then load the sample twice. Bring them back to explain why only two rows remain stored."
    ],
    "question": "Why does the second load leave the database with the same two rows?",
    "answer": "The first load commits two accepted employees. The second load conflicts with their stored primary keys, so the application rolls back that attempted batch and keeps the original rows.",
    "context": "The preview does not write data. The sample contains invalid records and a repeated ID; the default transform keeps the first valid record for an ID. Conflicts with IDs already stored in SQL are checked during loading."
  });

  scene('Hands-on data engineering',['Schema and queries','An ETL script','A supported workspace'],(d,s)=>{
    title(d,'Hands-on data engineering');
    const prompts=['Design keys. Create tables. Query a relationship.','Validate JSON. Load related rows. Test a failure.','Use the course database and approved connection path.'];text(d,'task',640,225,prompts[s],s===2?31:34);
    flow(d,['Predict','Run','Inspect'],s,365);
  },{
    "idea": "Test both valid input and a failure before trusting a data-loading workflow.",
    "builds": [
      "Start the schema and query exercise. Have students define keys, create the tables, and write a query that follows one relationship. Ask them to predict the result before running it.",
      "Move to the Python ETL exercise. Test valid JSON, then introduce an invalid reference and inspect the stored rows. Ask students to explain whether their chosen transaction boundary prevents a partial load.",
      "Check the workspace and connection setup. Students may use the approved local or university workspace, but they still need the course database endpoint and permissions. Inspect the result of each test before moving on."
    ],
    "question": "What evidence would show that a failed batch was rolled back completely?",
    "answer": "Compare the stored rows before and after the failed attempt. The earlier committed data should remain, with no new rows or changes from that attempted batch.",
    "context": "Allow about twelve minutes for the exercise and discussion. A university HPC or VS Code workspace is a client environment, not automatically the database server. Use current course setup instructions for repository, Python, network access, and credentials."
  }, '51–52',{kind:'activity',activity:'etl',minutes:12});

  scene('SQL handoff',['The assignment','Next class','An exit question'],(d,s)=>{
    title(d,'SQL handoff');text(d,'lab',640,220,'Lab 04 · Working with SQL',42,P.green);text(d,'due',640,315,'Due September 30',36,P.orange);
    if(s===1)text(d,'next',640,465,'Next: NoSQL databases',37);
    if(s===2)text(d,'question',640,465,'Which table owns each fact?',38);
  },{
    "idea": "Use keys, dependencies, and transactions to explain where each fact belongs and how it stays consistent.",
    "builds": [
      "Point to Lab 04: Working with SQL and the September 30 deadline. Have students check the current assignment instructions in Canvas.",
      "Preview the next class on NoSQL databases. Ask students to bring the same design questions: what is stored, how is it identified, and which queries matter?",
      "Return to the question, Which table owns each fact? Ask each group to explain one design choice from the restaurant, social application, or ETL exercise."
    ],
    "question": "Which table should own a user's email address when that user writes many posts?",
    "answer": "Users should store the email address. Posts should refer to the user through user_id, so an email change does not require editing every post.",
    "context": "The listed Lab 04 deadline is September 30. Canvas remains the authority for current dates and instructions. Prepare the Week 06 readings, What is a NoSQL Database? and What is MongoDB?, in Module 02."
  }, '53–54',{kind:'recap',minutes:2});

  window.COURSE_DECKS=window.COURSE_DECKS||{};
  window.COURSE_DECKS[5]={id:5,title:'SQL',date:'September 22 & 24, 2026',source:'lectures/lecture-05/index.html',scenes};
})();
