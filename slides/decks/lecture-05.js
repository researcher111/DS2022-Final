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
  function scene(name,states,draw,notes,sourceSlides,extra={}) {
    const sourceNumbers=sourceSlides.split(',').flatMap(part=>{const ends=part.trim().split(/[–-]/).map(Number);return ends.length===1?ends:Array.from({length:ends[1]-ends[0]+1},(_,i)=>ends[0]+i);});
    scenes.push(Object.assign({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:name,kind:'visual',steps:states.length,states,draw,minutes:2,sourceSlides:sourceNumbers,notes:'Source PowerPoint slides '+sourceSlides+'.\n\n'+notes},extra));
  }
  function exercise(activity,name,minutes,tasks,question,sourceSlides,notes) {
    scene('Exercise: '+name,['Switch to the interactive exercise'],d=>{
      title(d,'Switch to the interactive');
      d.text('exercise-name',80,200,name+' · '+minutes+' minutes',40,P.green,'start',600);
      tasks.forEach((task,i)=>d.text('exercise-task-'+i,80,300+i*52,task,31,P.ink,'start'));
      d.text('exercise-discussion',80,455,'Return ready to explain:',28,P.muted,'start');
      d.text('exercise-question',80,505,question,33,P.green,'start');
      d.text('exercise-link-hint',80,145,'Open this exercise with ↗ below',27,P.muted,'start');
    },'Pause the lecture and ask students to switch to this activity on their own screens. The green ↗ toolbar link opens the correct exercise in a separate tab. Allow approximately '+minutes+' minutes, then bring students back to discuss the displayed question. Reset the activity first if it was used earlier.\n\n'+notes,sourceSlides,{kind:'activity',activity,activityBreak:true,minutes});
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
  },'The uploaded lecture covers September 22 and September 24, 2026. It introduces databases, relational design, SQL, and a Python-to-database workflow. The second meeting starts at the schema practice scene. Suggested timings include group work and can span both class meetings. Ask learners to connect this lecture to last week’s scripts: where should a cleaned dataset live when several people need to read and update it?', '1–2',{kind:'title',minutes:1});

  scene('Questions about databases',['Individual ideas','A shared list'],(d,s)=>{
    title(d,'Questions about databases');text(d,'know',310,235,'What do you know?',36,P.blue);text(d,'want',940,235,'What do you want to know?',36,P.green);
    if(s){box(d,'group',410,355,460,100,'3–5 shared questions',true,P.green,35);}
  },'The source opens with a Know/Want-to-know activity. Give table groups ten minutes to combine their individual questions into three to five SQL or NoSQL topics, then report one question to the room. Ask one person per group to record the agreed list using the instructor’s current class channel. The source contains a short submission URL; its current destination has not been verified, so do not assume it is still the active form. Revisit the questions at the end to distinguish answered questions from next-lecture topics.', '3',{kind:'activity',minutes:10});

  scene('Storage and databases',['Storage interfaces','Database responsibilities'],(d,s)=>{
    title(d,'Storage and databases');
    ['Files','Blocks','Objects'].forEach((v,i)=>box(d,'storage-'+i,90+i*395,355,310,95,v,s===0,P.blue,34));
    if(s){box(d,'db',365,185,550,95,'Database management',true,P.green,35);[0,1,2].forEach(i=>d.arrow('storage-edge-'+i,640,290,245+i*395,340,P.green,3));}
  },'File storage presents named files in directories. Block storage presents addressable blocks, often underneath a filesystem or database engine. Object storage presents objects identified by keys, often through a network API. The source mentions local files, the university HPC system, and Amazon S3. A database system adds data organization, query processing, rules, and coordinated access on top of storage. The arrows show possible underlying storage choices, not a claim that every DBMS directly uses all three. Students will not directly operate raw block devices in this class.', '5',{minutes:2});

  scene('Database operations',['Create','Read','Update','Delete'],(d,s)=>{
    title(d,'Database operations');const labels=['Create','Read','Update','Delete'];
    labels.forEach((v,i)=>box(d,'operation-'+i,65+i*305,210,235,85,v,i===s,P.green,32));
    const rows=s===0?[['1','Alice']]:s===1?[['1','Alice'],['2','Bob']]:s===2?[['1','Alice'],['2','Robert']]:[['1','Alice']];
    table(d,'rows',380,345,[170,350],[['id','name'],...rows],{rowHeight:55,fontSize:32,highlightRows:s===2?[2]:[]});
  },'Databases store and organize data and support create, read, update, and delete operations, abbreviated CRUD. Here each build illustrates a different operation, not a script that should be replayed in this exact order. Create adds a row; read retrieves data; update changes an existing row; delete removes a row. A database can also represent relationships, including hierarchies and networks. Later scenes map these ideas to SQL statements. In CRUD, “create” commonly means inserting data, while SQL CREATE defines database objects.', '4, 6',{minutes:2});

  scene('Database management system',['A request','Query processing','Stored data and metadata'],(d,s)=>{
    flow(d,['Application','DBMS','Storage'],Math.min(s,2),270);
    if(s>=1)text(d,'processing',640,440,'plan  execute  enforce rules',29,P.green);
    if(s===2){text(d,'data',1010,230,'data + metadata',29,P.blue);}
  },'Trace the source architecture diagram: a user works through an application or query tool; database management software processes the request and accesses stored data. The system also maintains metadata describing tables, columns, indexes, and other objects. Ask which component should reject an invalid relationship even if two different applications write to it. Expected: a declared database constraint gives both applications the same enforced rule. Distinguish the managed collection of data from the DBMS software used to access it.', '7',{kind:'definition',term:'DBMS',definition:'Software that stores, queries, and controls access to a database.',minutes:2});

  scene('Data models',['Relational','Other common models','Workload matters'],(d,s)=>{
    title(d,'Data models');
    if(!s)table(d,'relational',245,205,[215,290,285],[['id','name','state'],...EMPLOYEES],{rowHeight:67,fontSize:33});
    if(s===1){[['Key-value','Redis'],['Document','MongoDB'],['Wide-column','Cassandra'],['Graph','Neo4j']].forEach(([a,b],i)=>{text(d,'model-'+i,380,205+i*88,a,34,P.green);text(d,'example-'+i,880,205+i*88,b,31,P.muted);});}
    if(s===2){flow(d,['Data shape','Queries','Constraints'],1,250);text(d,'choice',640,440,'Products combine capabilities',34,P.orange);}
  },'The source groups MySQL, PostgreSQL, SQLite, SQL Server, and Oracle as relational examples and lists key-value, document, column-family, and graph databases. Redis and DynamoDB, MongoDB, Cassandra, and Neo4j/Neptune illustrate those other models, though products can support multiple models. SQL is a query language rather than a universal architecture boundary. Correct the source’s absolute comparisons: nonrelational products can validate schemas and types, support expressive queries, and still require application mapping. Relational systems are not inherently fast or slow for every workload. Discuss shape, query patterns, constraints, and operational needs before selecting a system.', '8–11',{minutes:3,sources:['https://www.mongodb.com/docs/manual/core/schema-validation/','https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/SQLtoNoSQL.html']});

  scene('Scaling choices',['Vertical','Horizontal','Independent of data model'],(d,s)=>{
    title(d,'Scaling choices');text(d,'scaling-method',640,155,s?'Horizontal':'Vertical',32,P.green);
    if(!s){box(d,'machine',405,185,470,290,'One larger machine',true,P.blue,34);[0,1,2,3].forEach(i=>d.rect('capacity-'+i,465+i*80,380,58,45,P.blue,P.blue,3));}
    else{[0,1,2].forEach(i=>box(d,'node-'+i,125+i*365,240,300,150,'Node '+(i+1),true,P.green,34));d.line('network',275,435,1005,435,P.green,4);[0,1,2].forEach(i=>d.line('link-'+i,275+i*365,390,275+i*365,435,P.green,4));if(s===2)text(d,'scope',640,510,'SQL and NoSQL systems can use either',31,P.orange);}
  },'Vertical scaling increases resources on one machine, such as CPU, memory, or storage throughput. Horizontal scaling distributes work across machines and introduces communication, partitioning, replication, and failure-handling decisions. Correction to source slide 12: these are not exclusive SQL versus NoSQL categories. Distributed relational products exist, and a nonrelational database may run on one machine. More nodes do not guarantee proportional speedup. Google Spanner is one documented relational example of scaling compute capacity; a product’s actual scaling model should be checked in its own documentation.', '12',{minutes:2,sources:['https://cloud.google.com/spanner/docs/compute-capacity']});

  scene('Recovery and backlog',['Service interruption','Requests accumulate','Controlled recovery'],(d,s)=>{
    title(d,'Recovery and backlog');
    box(d,'app',90,260,250,90,'Applications',true,P.blue,31);box(d,'db',930,260,250,90,'Database',s===2,P.green,34);
    d.arrow('request',355,305,915,305,s===0?P.line:P.green,4);
    const count=s===0?2:s===1?9:4;for(let i=0;i<count;i++)d.rect('request-'+i,420+(i%5)*85,210+Math.floor(i/5)*100,60,45,P.orangeLight,P.orange,5,2);
    text(d,'status',640,465,['Unavailable','Growing queue','Retry with backoff'][s],35,P.orange);
  },'Use a generic failure scenario to explain the source’s useful recovery lesson. If a database or its network is unavailable, applications may accumulate work. Restoring connectivity does not instantly remove the backlog; uncontrolled retries can increase load. Ask how a client can retry safely when it does not know whether a previous write committed. Expected: bounded backoff and a design for detecting or avoiding duplicate operations. The source’s named outage dates, services, and durations conflict with the embedded images and have not been established here. This diagram is illustrative and makes no claim about those incidents.', '13',{minutes:2,sources:['https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/']});

  scene('A database in use',['Choose a product','Bring evidence'],(d,s)=>{
    title(d,'A database in use');['MySQL','Oracle','MongoDB','DynamoDB'].forEach((v,i)=>text(d,'product-'+i,215+i*280,235,v,33,i===s?P.green:P.ink));
    if(s)text(d,'question',640,400,'Who uses it, for which workload?',38,P.green);
  },'Assign the source’s four database examples to table groups. Allow five minutes to find one organization that uses the assigned product and, if available, the application or data it supports. Require a dated primary source such as a company engineering article or the vendor’s named customer case study. Ask each group to record product, organization, workload, and source. Do not infer that a company uses the same database for all its applications. This is a student research exercise, not an unsupported customer claim in the lecture.', '14',{kind:'activity',minutes:5});

  scene('Related tables',['Entities','Relationships','Rules'],(d,s)=>{
    title(d,'Related tables');employeeTable(d,'employees',65,230);
    table(d,'states',805,230,[150,240],[['state_code','home_state'],...STATES],{rowHeight:58,fontSize:27});
    if(s>=1)d.arrow('relationship',600,317,785,317,P.green,4);
    if(s===2)text(d,'constraint',640,510,'Declared constraints protect relationships',31,P.green);
  },'Relational databases organize data into tables with rows and columns. Primary keys identify rows; foreign keys can enforce relationships; SQL joins combine related data for a query. Constraints express rules such as required values, uniqueness, and valid references. Transaction behavior belongs to the engine and its configuration, so say “MySQL with InnoDB” for the transactional examples rather than implying every possible storage engine has identical guarantees. Ask which table owns the spelling of Michigan and why a reference avoids copying that spelling into every assignment.', '15–16',{activity:'keys',minutes:2});

  scene('Schema',['Field definitions','Different records','Constraints'],(d,s)=>{
    table(d,'schema',110,245,[290,240,470],[['field','type','example'],['name','text',s===0?'Michael Jordan':'Adele Adkins'],['birth_year','integer',s===0?'1963':'1988'],['retired','boolean','true / false']],{rowHeight:60,fontSize:29});
    if(s===2)text(d,'required',640,510,'name: required',31,P.green);
  },'The source uses famous-person records to distinguish a shared structure from the values of individual records. Country and realm are additional text fields in that example, with name and realm required. Here the boolean column shows allowed value forms rather than making a current claim about anyone’s retirement. A schema description includes fields, types, relationships, and constraints. It is distinct from the current records. Database products also use “schema” as an object namespace; MySQL commonly treats SCHEMA and DATABASE as synonyms. That product terminology does not change the structure-versus-values lesson.', '17–18',{kind:'definition',term:'Schema',definition:'The defined structure, types, relationships, and constraints of data.',minutes:2,sources:[MYSQL+'create-database.html']});

  scene('Tables and views',['Stored rows','A saved query','A derived result'],(d,s)=>{
    title(d,'Tables and views');employeeTable(d,'base',75,220);
    if(s>=1){d.arrow('view-edge',620,322,760,322,P.green,4);box(d,'view',785,240,350,95,'View',true,P.green,35);}
    if(s===2)table(d,'result',795,365,[130,200],[['id','name'],['1','Alice']],{rowHeight:58,fontSize:30});
    if(s>=1)text(d,'query',915,185,'state_code = 26',28,P.muted);
  },'A base table stores rows. An ordinary view stores a query definition and presents that query’s result as a table-like interface. The source image shows several employee tables and two views; this simpler example filters one table. A view is not necessarily a stored snapshot or an automatic performance improvement. Materialized views are a separate feature in products that support them. Ask whether a normal view can reflect changed base data when queried again: yes, according to the query and transaction visibility. Do not confuse a view with a new independent copy of each row.', '19',{minutes:2,sources:[MYSQL+'create-view.html']});

  scene('Objects and rows',['An object graph','Relational rows','A mapping layer'],(d,s)=>{
    title(d,'Objects and rows');box(d,'object',80,215,300,90,'Employee object',true,P.blue,31);box(d,'jobs',95,395,270,65,'jobs: [...]',true,P.blue,30);d.arrow('object-link',230,320,230,380,P.blue,3);
    table(d,'row',865,230,[125,180],[['id','name'],['1','Alice']],{rowHeight:64,fontSize:30});
    if(s>=1)d.arrow('mapping',395,275,835,295,P.green,4);
    if(s===2)box(d,'orm',485,360,270,80,'ORM',true,P.green,34);
  },'Object-oriented programs represent references, collections, behavior, and sometimes inheritance. Relational tables represent rows, columns, keys, and relations. Mapping between these models requires decisions about identity, relationships, loading, and updates. This is the source’s “impedance mismatch.” An object-relational mapper can perform much of that translation, but does not eliminate the underlying database design or query costs. The source later names SQLAlchemy, Django ORM, and Peewee. Nonrelational products can also require mapping; avoid the source’s blanket claim that all NoSQL has no mismatch.', '20, 38',{minutes:2,sources:['https://docs.sqlalchemy.org/en/20/orm/quickstart.html']});

  scene('Primary key',['A unique identifier','A repeated name','A rejected duplicate key'],(d,s)=>{
    table(d,'pk',200,245,[260,320,300],[['employee_id','name','state_code'],...EMPLOYEES],{rowHeight:62,fontSize:31,highlightCols:[0],highlightRows:s===1?[1,3]:[]});
    if(s===2)text(d,'reject',640,520,'Another employee_id = 1: reject',30,P.red);
  },'The source’s item_id example uniquely identifies inventory rows. The same rule applies to this restaurant dataset: one primary key constraint identifies every employee row and prohibits NULL. A primary key may contain multiple columns. Other unique constraints may also exist. Choose a stable identifier; a name need not be unique. The source’s Alice with employee_id 1 and Alice with employee_id 3 are different employees, not duplicate records. The duplicate-key build proposes a new conflicting identifier and is rejected; it does not reject the repeated name.', '21',{kind:'definition',term:'Primary key',definition:'A column or column combination that uniquely identifies every row and cannot contain NULL.',activity:'keys',minutes:3,sources:[MYSQL+'create-table.html']});

  scene('Foreign key',['A referenced row','A valid child','An invalid reference'],(d,s)=>{
    title(d,'Foreign key');employeeTable(d,'employees',70,225,s===2?[['1','Alice','99']]:[EMPLOYEES[0]]);
    table(d,'states',800,225,[150,250],[['state_code','home_state'],...STATES],{rowHeight:60,fontSize:28,highlightRows:s===2?[]:[1]});
    d.arrow('reference',605,315,780,315,s===2?P.red:P.green,4);
    if(s>=1)text(d,'outcome',640,455,s===2?'No state 99: reject':'State 26 exists: accept',33,s===2?P.red:P.green);
  },'A foreign key links referencing columns to a declared referenced key. For this teaching schema, employees.state_code references the unique states.state_code. It can reject a non-NULL value such as 99 when no referenced row exists. A foreign key does not automatically prohibit NULL; add NOT NULL when a relationship is required. Deleting or changing a referenced row follows the configured referential action, such as restrict or cascade. The source’s Items diagram has analogous references to Item_Types and Makers. Follow arrow direction carefully: child values reference a parent key.', '22',{activity:'keys',minutes:3,sources:[MYSQL+'create-table-foreign-keys.html']});

  scene('Matching rows',['The tables','A matching value','Combined data'],(d,s)=>{
    title(d,'Matching rows');
    employeeTable(d,'employee',60,195,[EMPLOYEES[0]]);table(d,'state',815,195,[140,245],[['state_code','home_state'],STATES[0]],{rowHeight:58,fontSize:27});
    if(s>=1)d.arrow('match',595,282,795,282,P.green,4);
    if(s===2)table(d,'joined',360,395,[225,335],[['name','home_state'],['Alice','Michigan']],{rowHeight:57,fontSize:32});
  },'Before teaching JOIN syntax, trace one matching pair. Alice 1 has state_code 26 and the states table maps 26 to Michigan. The query combines selected columns from matching rows. A foreign-key constraint can protect the relationship, but the JOIN operator itself does not require a declared foreign key. If several rows match a join condition, the result can contain several combinations. A relational join does not permanently glue the underlying tables together.', '16, 22',{activity:'keys',minutes:2,sources:[MYSQL+'join.html']});

  exercise('keys','Keys & joins',3,
    ['Try an orphan with the foreign key on, then off.','Compare INNER JOIN and LEFT JOIN.'],
    'Which join keeps the orphan?','21–22',
    'Choose Orphan maker and try INSERT with enforcement enabled: the model rejects it. Disable enforcement and try again, then compare the join types. LEFT JOIN keeps the item with NULL maker fields; INNER JOIN omits the unmatched item. Return to the lecture to connect database rules with transaction boundaries.');

  scene('A transaction',['Before','Pending changes','Commit','Alternative: rollback'],(d,s)=>{
    title(d,'A transaction');const values=(s===1||s===2)?[90,60]:[100,50];
    box(d,'account-a',150,225,360,170,'Account A',true,P.blue,34);box(d,'account-b',770,225,360,170,'Account B',true,P.green,34);
    text(d,'amount-a',330,355,values[0],44,P.blue);text(d,'amount-b',950,355,values[1],44,P.green);d.arrow('transfer',530,300,750,300,P.orange,4);
    text(d,'state',640,480,['Before transfer','Both changes pending','COMMIT','Alternative: ROLLBACK'][s],35,s===3?P.orange:P.green);
  },'This illustrative transfer moves ten units from A to B. Treat the debit and credit as one transaction: either both take effect or neither does. The pending build shows both proposed changes, followed by commit. The final build is an alternative failure outcome, rolling back instead of committing; it is not a rollback of an already committed transfer. A transaction groups related statements and is not a guarantee that the business logic is correct. Use the activity to choose a success or failure path before revealing the result.', '23',{activity:'transactions',minutes:3,sources:[MYSQL+'commit.html']});

  scene('ACID properties',['Atomicity','Consistency','Isolation','Durability'],(d,s)=>{
    title(d,'ACID properties');const terms=['Atomicity','Consistency','Isolation','Durability'];text(d,'term',640,220,terms[s],50,P.green);
    const labels=[['All changes','or none'],['Declared rules','remain satisfied'],['Concurrent work','controlled visibility'],['Committed result','survives failures']][s];
    box(d,'left',170,345,400,95,labels[0],true,P.blue,32);box(d,'right',710,345,400,95,labels[1],true,P.green,32);d.arrow('property',590,392,690,392,P.green,4);
  },'Atomicity groups all changes into one outcome. Consistency means transactions preserve declared invariants when the transaction logic and constraints enforce them; the database does not know every real-world rule automatically. Isolation controls how concurrent transactions observe and affect one another, with different guarantees at different isolation levels. Durability means committed changes persist under the system’s stated failure model and durability configuration. The source mentions money, clinical records, inventory, and regulated records as examples where correctness matters. Do not translate ACID into “no possible interference or data loss under every event.”', '23',{activity:'transactions',minutes:3,sources:['https://dev.mysql.com/doc/refman/8.0/en/mysql-acid.html',MYSQL+'innodb-transaction-isolation-levels.html']});

  exercise('transactions','Transactions',3,
    ['Enable credit failure. Begin, debit, then credit.'],
    'Why do committed balances stay unchanged?','23',
    'Enable the simulated credit failure before BEGIN. Students should see the pending debit only in the private view. The failed credit causes this application model to roll back the entire transfer, preserving both committed balances. An arbitrary SQL error does not necessarily roll back the whole transaction by itself. Resume with how table design prevents inconsistent repeated facts.');

  scene('Normalization',['Repeated facts','Dependencies','Separate responsibilities'],(d,s)=>{
    flow(d,['1NF','2NF','3NF'],s,300);text(d,'rule',640,470,['One value per cell','Depend on the whole key','Separate transitive dependencies'][s],34,P.green);
  },'Normalization uses functional dependencies to organize relational tables and reduce avoidable repetition and modification anomalies. Introduce the first three normal forms as a sequence applied to the restaurant example. The shorthand on the slide is introductory: formal definitions consider candidate keys and non-prime attributes, not only whichever key was chosen as primary. Higher normal forms exist and can matter, so 3NF is not a universal ceiling. Atomicity here concerns the chosen data domain, not whether a string can be split into characters.', '24–25',{kind:'definition',term:'Normalization',definition:'Organizing tables around dependencies to reduce repeated facts and modification anomalies.',activity:'normalization',minutes:2});

  scene('Restaurant assignments',['Several jobs in one cell','One employee, several assignments'],(d,s)=>{
    title(d,'Restaurant assignments');
    if(!s)table(d,'lists',155,215,[220,200,550],[['employee_id','name','jobs'],['1','Alice','Chef, Waiter'],['2','Bob','Waiter, Bartender'],['3','Alice','Chef']],{rowHeight:66,fontSize:30,highlightCols:[2]});
    else{table(d,'one',165,210,[230,260],[['employee_id','name'],['1','Alice']],{rowHeight:65,fontSize:31});table(d,'many',810,210,[270],[['job'],['Chef'],['Waiter']],{rowHeight:65,fontSize:31});d.arrow('assign',675,280,790,280,P.green,4);}
  },'Read the source restaurant dataset. Employee 1 is Alice in Michigan with Chef and Waiter assignments. Employee 2 is Bob in Wyoming with Waiter and Bartender assignments. Employee 3 is a different Alice in Wyoming with a Chef assignment. A comma-separated job list makes individual assignments harder to constrain and query. The source’s unnormalized row associates only one job_code with a multi-job field; this adaptation omits that misleading single code until each assignment has its own row. Ask how to identify an employee without assuming names are unique.', '26',{activity:'normalization',minutes:2});

  scene('First normal form',['Separate assignment rows','A composite key'],(d,s)=>{
    title(d,'First normal form');table(d,'restaurant',65,170,[190,130,155,175,160,205],[['employee_id','name','job_code','job','state_code','home_state'],...RESTAURANT],{rowHeight:54,fontSize:26,highlightCols:s?[0,2]:[]});
    if(s)text(d,'key',640,515,'Key: (employee_id, job_code)',29,P.green);
  },'Now each row represents one employee/job assignment with one value per field. The composite key (employee_id, job_code) identifies that assignment. employee_id alone repeats when one employee has multiple jobs; job_code alone repeats when multiple employees share a job. A surrogate row id could identify rows too, but it would not make the underlying partial dependencies disappear. The full five assignment rows preserve the original data, including the distinct employees named Alice. This is the first-normal-form starting table for the next steps.', '26',{activity:'normalization',minutes:3});

  scene('An update anomaly',['Repeated employee facts','Only one row updated','One inconsistent person'],(d,s)=>{
    title(d,'An update anomaly');const rows=RESTAURANT.filter(r=>r[0]==='1').map(r=>[r[0],r[2],r[4],r[5]]);if(s>=1)rows[0]=['1','J01','56','Wyoming'];
    table(d,'move',140,220,[245,235,245,275],[['employee_id','job_code','state_code','home_state'],...rows],{rowHeight:78,fontSize:31,highlightRows:s?[1]:[]});
    if(s===2)text(d,'problem',640,505,'Employee 1 now has two home states',31,P.red);
  },'Ask what must change when Alice with employee_id 1 moves from Michigan to Wyoming. Both assignment rows carrying her home state must change. Updating only the Chef row leaves contradictory facts about the same employee. Alice with employee_id 3 is a different person and should not be updated just because her name matches. The source asks “if Alice moves”; the identifier makes the intended person unambiguous. A transaction could update both rows together, but a better dependency structure avoids storing the same employee fact repeatedly.', '27',{activity:'normalization',minutes:3});

  scene('Partial dependencies',['The assignment key','Employee facts','Job facts'],(d,s)=>{
    title(d,'Partial dependencies');box(d,'emp-key',100,205,390,80,'employee_id',true,P.blue,34);box(d,'job-key',790,205,390,80,'job_code',true,P.green,34);
    text(d,'composite',640,160,'(employee_id, job_code)',30,P.muted);
    if(s>=1){d.arrow('emp-dep',295,300,295,365,P.blue,4);box(d,'emp-facts',100,380,390,85,'name, state_code, home_state',true,P.blue,25);}
    if(s===2){d.arrow('job-dep',985,300,985,365,P.green,4);box(d,'job-facts',790,380,390,85,'job',true,P.green,34);}
  },'State the domain assumptions explicitly: employee_id determines the employee’s name and home state; job_code determines the job title. These non-key facts depend on only part of the assignment table’s composite key. Second normal form removes those partial dependencies. Merely adding an arbitrary unique id to the original wide table does not repair the meaningful candidate-key dependencies. Ask which facts depend on the assignment itself rather than the employee or job. A future assignment-specific value, such as its start date under an appropriate key, belongs with the assignment.', '25, 28',{activity:'normalization',minutes:3});

  scene('Second normal form',['Employee facts','Job facts','Assignments remain'],(d,s)=>{
    title(d,'Second normal form');
    table(d,'people',50,220,[155,100,150,180],[['employee_id','name','state_code','home_state'],['1','Alice','26','Michigan'],['2','Bob','56','Wyoming'],['3','Alice','56','Wyoming']],{rowHeight:62,fontSize:25});
    text(d,'employee-label',345,170,'Employees',30,P.blue);
    if(s===1){text(d,'job-label',955,170,'Jobs',30,P.green);table(d,'jobs',775,220,[160,215],[['job_code','job'],...JOBS],{rowHeight:62,fontSize:29});}
    if(s===2){text(d,'assignment-label',955,170,'Assignments',30,P.green);table(d,'assignments',775,220,[200,175],[['employee_id','job_code'],...ASSIGNMENTS],{rowHeight:45,fontSize:27});}
    if(!s)text(d,'fact',930,330,'One row per employee',30,P.green);
  },'The three tables are Employees, Jobs, and Assignments. Builds reveal Jobs and then Assignments beside Employees to keep all labels readable. Employees has one row per employee_id, Jobs one row per job_code, and Assignments retains the composite key (employee_id, job_code) with foreign keys to both tables. Reconstruct all five original assignments using these references. Employee facts and job titles no longer repeat per assignment. Employees still stores state_code and home_state together; that remaining dependency motivates the third-normal-form step.', '28',{activity:'normalization',minutes:3});

  scene('A transitive dependency',['Employee to state code','State code to state name'],(d,s)=>{
    title(d,'A transitive dependency');flow(d,['employee_id','state_code','home_state'],s?2:0,260);
    text(d,'id',305,425,'1',36,P.blue);text(d,'code',640,425,'26',36,P.green);text(d,'state',975,425,'Michigan',36,P.green);
  },'Under this example’s domain rules, each employee has one home state and each state_code identifies a home_state name. The state name therefore depends on employee_id through state_code. Multiple employees can share a state, so correcting the state name in every employee row would repeat work and risk disagreement. Source slide 28 says the name and code determine one another; the decomposition only needs the stated unique state_code-to-name rule. Do not assume arbitrary real-world names are globally unique identifiers.', '28–29',{activity:'normalization',minutes:2});

  scene('Third normal form',['A state lookup','Employee references','One state-name update'],(d,s)=>{
    title(d,'Third normal form');employeeTable(d,'employees',55,235);
    table(d,'states',785,235,[175,260],[['state_code','home_state'],...STATES],{rowHeight:58,fontSize:29,highlightRows:s===2?[1]:[]});
    if(s>=1)d.arrow('lookup',590,322,765,322,P.green,4);
    if(s===2)text(d,'update',640,510,'State names live in one table',32,P.green);
  },'Move the state-code/name mapping to States and keep employees.state_code as a foreign key. Jobs and Assignments from the previous step remain part of the design, yielding four tables overall. Employee 1 maps to Michigan; employee 2 and the distinct employee 3 map to Wyoming. A state-name correction happens in the lookup table rather than every employee or assignment row. This example reaches 3NF under its stated candidate keys and dependencies. Normalization does not remove every repeated value: foreign-key values intentionally repeat to represent relationships.', '29',{activity:'normalization',minutes:3});

  exercise('normalization','Normalization',4,
    ['In 1NF, update one Alice #1 row.','Repeat the move in 3NF.'],
    'Why is Alice #3 unchanged?','26–29',
    'In 1NF, update only one assignment row for employee 1 to expose contradictory home states. Switching normal forms resets the move; in 3NF, update employee 1 once and inspect the joined facts. Alice #3 has a different employee_id and is a different person. Ask which repeated employee facts disappeared before returning to normalization tradeoffs.');

  scene('Normalization tradeoffs',['Fewer repeated facts','Read workload','Measured denormalization'],(d,s)=>{
    title(d,'Normalization tradeoffs');
    const labels=[['Separate facts','Safer updates'],['Related tables','Joins at query time'],['Stored summary','Refresh responsibility']][s];flow(d,labels,0,255);
    text(d,'measure',640,450,s===2?'Measure queries and define consistency rules':'Integrity and performance require different checks',31,P.orange);
  },'Normalization reduces unnecessary repetition and insertion, update, and deletion anomalies. Correct source slide 30: it does not guarantee faster queries. Join costs, indexes, data size, caching, and query patterns matter. Deliberate denormalization can help a measured read workload, but someone must maintain consistency between redundant representations. The source contrasts transactional OLTP and analytical OLAP; treat that as a useful workload distinction rather than an absolute rule that every operational schema or warehouse must use one design. Higher normal forms can be appropriate when additional dependencies exist.', '30–31',{minutes:2,sources:['https://learn.microsoft.com/en-us/sql/relational-databases/performance/joins?view=sql-server-ver16']});

  scene('Structured Query Language',['A requested result','An execution plan'],(d,s)=>{
    code(d,'query',['SELECT name FROM employees','WHERE state_code = 26;'],100,245,36,60);
    if(s){box(d,'plan',420,400,440,90,'DBMS chooses a plan',true,P.green,32);}
  },'SQL expresses operations on data and definitions of database objects. A SELECT states the desired result, while the DBMS determines an execution plan. The source shows command-line tools, SQL scripts, and Python reaching databases managed by MySQL. SQL has a shared foundation, but products differ in dialect, types, functions, and administration commands. The examples in this lecture target MySQL. Writing a declarative query does not mean performance is automatic; schema, indexes, statistics, and the exact query still matter.', '32–33',{kind:'definition',term:'SQL',definition:'A language for defining database objects and querying or modifying relational data.',activity:'queries',minutes:2});

  scene('A database for the examples',['Create','Select'],(d,s)=>{
    title(d,'A database for the examples');code(d,'database',['CREATE DATABASE restaurant;','USE restaurant;'],100,225,39,90,s);
    if(s)text(d,'context',640,465,'Current database: restaurant',33,P.green);
  },'CREATE DATABASE creates a named database, subject to permissions and whether the name already exists. USE changes the current database for the session so unqualified table names refer there. This corrects the visual ordering on source slide 34: create the database before selecting it and defining its tables. The semicolon terminates statements in common SQL client workflows; it is not a separate SQL operation. Use a disposable course database for demonstrations. Repeated execution of plain CREATE DATABASE may fail if the object already exists.', '34',{minutes:2,sources:[MYSQL+'create-database.html',MYSQL+'use.html']});

  scene('A table definition',['Columns and types','The primary key'],(d,s)=>{
    title(d,'A table definition');code(d,'create',['CREATE TABLE employees (','    employee_id INT PRIMARY KEY,','    name VARCHAR(50) NOT NULL,','    state_code INT',');'],100,190,33,62,s?1:2);
  },'The table definition declares integer employee identifiers, required names with a maximum character length, and a state_code. The source calls this last field state_id; this lecture consistently uses state_code to match the restaurant normalization tables. This short first table omits the foreign key so students can focus on column definitions; add it once States exists, as shown in the keys activity and companion. PRIMARY KEY supplies uniqueness and non-NULL requirements for employee_id. State codes here are numeric identifiers, not quantities to add.', '34',{activity:'keys',minutes:2,sources:[MYSQL+'create-table.html']});

  scene('INSERT creates rows',['Explicit columns','One record','A second employee'],(d,s)=>{
    title(d,'INSERT creates rows');code(d,'insert',['INSERT INTO employees','    (employee_id, name, state_code)',s===2?"VALUES (2, 'Bob', 56);":"VALUES (1, 'Alice', 26);"],90,185,34,61,s===0?1:2);
    if(s>=1)table(d,'created',370,405,[160,220,160],[['id','name','state'],s===2?EMPLOYEES[1]:EMPLOYEES[0]],{rowHeight:53,fontSize:30});
  },'INSERT lists destination columns and corresponding values. Use straight single quotes for SQL text literals. The first inserted record is employee 1, Alice, state 26; the second is employee 2, Bob, state 56. Explicit column lists make the intended mapping easier to review and less dependent on table definition order. Duplicate keys, missing required values, or invalid foreign keys can reject an insert. The three-row sample used later also contains employee 3, the distinct Alice in state 56; insert that record when building the full teaching dataset.', '34',{activity:'queries',minutes:2,sources:[MYSQL+'insert.html']});

  scene('SELECT reads rows',['Source rows','Filter','Selected columns'],(d,s)=>{
    title(d,'SELECT reads rows');code(d,'select',["SELECT employee_id, name","FROM employees","WHERE name = 'Alice';"],80,160,32,45,s===0?1:s===1?2:0);
    table(d,'selection',300,340,[300,350],[['employee_id','name'],...(s===0?EMPLOYEES:EMPLOYEES.filter(r=>r[1]==='Alice')).map(r=>r.slice(0,2))],{rowHeight:51,fontSize:31,highlightRows:s===1?[1,2]:[]});
  },'FROM supplies rows, WHERE tests a condition, and the SELECT list chooses output expressions. The diagram is a conceptual teaching order, not an assertion about the optimizer’s physical execution. Filtering name = Alice returns employee_ids 1 and 3 because both rows have that name. SELECT * retrieves every column, but selecting specific columns makes the interface clearer. A query without ORDER BY does not promise a particular result order. This scene shows a small illustrative ordering for readability.', '34',{activity:'queries',minutes:3,sources:[MYSQL+'select.html']});

  scene('AND and OR filters',['AND','OR','Explicit grouping'],(d,s)=>{
    title(d,'AND and OR filters');const condition=s===0?"name = 'Alice' AND state_code = 56":s===1?"name = 'Alice' OR state_code = 56":"(name = 'Alice' OR name = 'Bob')";
    code(d,'filter',['SELECT employee_id FROM employees','WHERE '+condition+(s===2?'':';'),...(s===2?['  AND state_code = 56;']:[])],75,180,30,62);
    text(d,'result',640,465,s===0?'Matches: 3':s===1?'Matches: 1, 2, 3':'Matches: 2, 3',36,P.green);
  },'Use the three source employees. AND requires both tests: Alice in state 56 is employee 3. OR allows either: all three rows match Alice or state 56. The grouped example selects Alice or Bob and then requires state 56, returning employees 2 and 3. AND has higher precedence than OR in MySQL, but parentheses make intent clear and prevent common mistakes. SQL also has NULL and three-valued logic; WHERE retains rows whose predicate is TRUE, not FALSE or UNKNOWN. Use IS NULL to test missing values, not equality to NULL.', '36',{activity:'queries',minutes:3,sources:[MYSQL+'operator-precedence.html',MYSQL+'working-with-null.html']});

  scene('Ordering and limiting',['An explicit order','The first two rows'],(d,s)=>{
    title(d,'Ordering and limiting');code(d,'limit',['SELECT employee_id, name','FROM employees','ORDER BY employee_id','LIMIT 2;'],95,165,32,46,s?3:2);
    table(d,'limited',330,330,[280,340],[['employee_id','name'],...EMPLOYEES.slice(0,s?2:3).map(r=>r.slice(0,2))],{rowHeight:50,fontSize:29});
  },'LIMIT caps the number of returned rows. Pair it with ORDER BY when the selected subset must be predictable. Ordering by the unique employee_id makes the first two rows unambiguous here. Without ORDER BY, a database may return a different subset after an index change, plan change, or data update. LIMIT syntax varies across database systems; this is MySQL syntax. The source introduces LIMIT but omits ordering, so this scene supplies the necessary qualification.', '36',{activity:'queries',minutes:2,sources:[MYSQL+'limit-optimization.html']});

  scene('JOIN across tables',['Match the keys','Choose output fields'],(d,s)=>{
    title(d,'JOIN across tables');code(d,'join',['SELECT e.name, s.home_state','FROM employees AS e','JOIN states AS s','  ON e.state_code = s.state_code','WHERE e.employee_id = 1;'],75,170,30,48,s?0:3);
    if(s)table(d,'joined',390,420,[200,330],[['name','home_state'],['Alice','Michigan']],{rowHeight:50,fontSize:28});
  },'The aliases e and s make column ownership visible. The ON condition pairs employee rows with matching state rows, and WHERE narrows to employee 1. This is an inner join: an employee without a matching state row would not appear. The source introduces JOIN as selecting across tables; this example makes its match rule explicit. LEFT JOIN is a useful next extension when unmatched employees should remain. A correct join condition prevents accidental Cartesian multiplication but does not imply one output row per input in every schema.', '36',{activity:'queries',minutes:3,sources:[MYSQL+'join.html']});

  scene('UPDATE changes matching rows',['Preview the target','Update by identifier','The result'],(d,s)=>{
    title(d,'UPDATE changes matching rows');
    code(d,'update',s?['UPDATE employees','SET state_code = 56','WHERE employee_id = 1;']:['SELECT * FROM employees','WHERE employee_id = 1;'],95,180,34,61,s?2:1);
    if(s===2)employeeTable(d,'changed',365,385,[['1','Alice','56']],[1]);
  },'First inspect which row the predicate selects, then update that identifier. Source slide 34 filters an update by name = Alice, which would change both distinct Alice employees in the full dataset. Use employee_id = 1 when only that person is moving. An UPDATE without WHERE can affect every row. In an explicit transaction, commit makes the change durable and rollback can abandon it before commit. The displayed result assumes the update succeeds and the new referenced state exists.', '34',{activity:'queries',minutes:3,sources:[MYSQL+'update.html']});

  scene('DELETE removes matching rows',['Preview assignments','Delete child rows','Delete the employee and commit'],(d,s)=>{
    title(d,'DELETE removes matching rows');
    const lines=s===0?['SELECT * FROM employee_jobs','WHERE employee_id = 2;']:s===1?['BEGIN;','DELETE FROM employee_jobs','WHERE employee_id = 2;']:['DELETE FROM employees','WHERE employee_id = 2;','COMMIT;'];
    code(d,'delete',lines,95,170,34,56,s===0?1:s===1?1:0);
    if(s===0)table(d,'dependencies',360,345,[260,260],[['employee_id','job_code'],['2','J02'],['2','J03']],{rowHeight:53,fontSize:29});
    if(s===2)table(d,'remaining',335,345,[280,320],[['employee_id','name'],['1','Alice'],['3','Alice']],{rowHeight:53,fontSize:30});
  },'DELETE removes rows while preserving the table definition. Preview employee 2’s two assignments in employee_jobs first. A restrictive foreign key rejects deleting the employee while those child rows still reference it. In one transaction, delete the child assignments, delete the employee, and commit only when the full operation succeeds. On failure, roll back the transaction. The final result retains employees 1 and 3, the distinct Alices. The statements continue across builds rather than being independent alternatives. If a schema instead declares ON DELETE CASCADE, its behavior differs; this example uses the restrictive relationship in the activity. Preview targeted rows before modifying data. No WHERE can mean all rows.', '34, 36',{activity:'queries',minutes:3,sources:[MYSQL+'delete.html',MYSQL+'create-table-foreign-keys.html',MYSQL+'commit.html']});

  scene('Schema inspection and DROP',['Inspect the structure','Remove the table'],(d,s)=>{
    title(d,'Schema inspection and DROP');
    code(d,'ddl',s?['DROP TABLE scratch_employees;']:['DESCRIBE employees;'],95,220,39);
    text(d,'effect',640,390,s?'Definition and stored rows are removed':'Columns, types, nullability, and keys',34,s?P.orange:P.green);
    if(s)text(d,'scope',640,490,'Use a disposable example table',30,P.muted);
  },'DESCRIBE is a MySQL schema-inspection command. DROP TABLE removes a table object and its stored rows; DROP DATABASE removes a database and its objects. This differs from DELETE, which modifies table contents. Many MySQL DDL statements cause implicit commits and are not ordinary rollback demonstrations. The displayed scratch table is intentionally separate from the class’s main data. Do not run DROP against a shared or important database merely to illustrate the syntax. SQL clients commonly use semicolons as statement terminators; a semicolon is not one of the CRUD operations.', '36',{minutes:2,sources:[MYSQL+'describe.html',MYSQL+'drop-table.html',MYSQL+'implicit-commit.html']});

  scene('SQL prediction practice',['Predict','Run','Explain'],(d,s)=>{
    title(d,'SQL prediction practice');code(d,'question',["SELECT employee_id FROM employees","WHERE name = 'Alice'","ORDER BY employee_id LIMIT 1;"],90,195,31,67);
    text(d,'answer',640,465,s===0?'Which identifier appears?':s===1?'1':'The name matches two rows; ordering selects one.',s===2?29:38,s?P.green:P.ink);
  },'Use this as the live SQL demonstration handoff. Ask for a prediction and a reason before running the statement against the complete three-employee dataset. The answer is employee_id 1: two names match, ordering puts 1 before 3, and LIMIT keeps one row. Change one clause at a time so learners can explain the effect. The source alternates between demo/06-sql and demo/05-sql paths; use the companion and the instructor’s current course checkout rather than silently asserting which old path is authoritative.', '35',{kind:'activity',activity:'queries',minutes:4});

  exercise('queries','SQL query playground',4,
    ['Run JOIN, then add before ORDER BY:','WHERE e.employee_id = 1'],
    'Why does one employee produce two rows?','35–36',
    'Load the Relate · JOIN example in the SQLite playground. Predict the output before running it. Add WHERE e.employee_id = 1 on a new line before ORDER BY and run again. Employee 1 has two job assignments, so the result has two rows. Return to the lecture to see Python send SQL and values through a driver.');

  scene('Python and the database',['A driver','SQL and values','Rows back to Python'],(d,s)=>{
    title(d,'Python and the database');flow(d,['Python','Connector','MySQL'],s,260);
    text(d,'library',640,190,'mysql-connector-python',32,P.green);
    if(s>=1)text(d,'payload',640,450,s===1?'SQL statement + parameters':'Rows become Python values',33,P.blue);
  },'The source uses mysql-connector-python as its database driver. A driver implements the protocol and maps data between Python and MySQL. PyMySQL, mysqlclient, and async alternatives have their own APIs and parameter conventions. An ORM is a higher abstraction that maps objects and relations; it is not the same thing as the network connector itself. The following snippets illustrate separate parts of one connection lifecycle. Use the complete companion example for a runnable script with configuration and cleanup.', '37–38',{minutes:2,sources:[CONNECTOR+'connector-python-introduction.html']});

  scene('Connection configuration',['Configuration from the environment','Open the connection'],(d,s)=>{
    title(d,'Connection configuration');code(d,'connect',['import os','import mysql.connector','conn = mysql.connector.connect(','    host=os.environ["DB_HOST"],','    user=os.environ["DB_USER"],','    password=os.environ["DB_PASSWORD"],','    database=os.environ["DB_NAME"]',')'],90,168,29,45,s?2:5);
  },'Environment variables keep credentials out of the displayed source file and ordinary repository history. Configure them through the instructor’s approved mechanism; an unset required os.environ key produces a clear configuration failure. Environment variables are not a complete secret-management system, and an env file containing secrets must not be committed. The real connection also needs the correct port, network access, server trust/TLS settings, and permissions. Follow the managed database’s TLS instructions rather than disabling certificate checks to make a connection work. This introductory snippet leaves those deployment-specific options to the complete example.', '39',{minutes:3,sources:[CONNECTOR+'connector-python-connectargs.html']});

  scene('A parameterized query',['The statement','Separate values','Dictionary rows'],(d,s)=>{
    title(d,'A parameterized query');
    const lines=s===2?['for row in cursor.fetchall():','    print(row["employee_id"], row["name"])']:['cursor = conn.cursor(dictionary=True)','sql = "SELECT employee_id, name FROM employees"','sql += " WHERE state_code = %s"','cursor.execute(sql, (26,))'];
    code(d,'parameters',lines,80,200,30,68,s===0?2:s===1?3:1);
    if(s===2)text(d,'result',640,440,'1  Alice',35,P.green);
  },'Connector/Python binds values supplied separately to %s placeholders. Do not put quotes around the placeholder or interpolate user input into the SQL string. (26,) is a one-element Python tuple; the comma matters. dictionary=True makes returned rows accessible by column name. fetchall retrieves all remaining rows, which is convenient for this tiny example but can use substantial memory for a large result. Parameter binding is for values, not arbitrary SQL identifiers or whole clauses; validate any dynamic identifiers against an explicit allowlist. The example result assumes the original source dataset.', '39',{activity:'queries',minutes:3,sources:[CONNECTOR+'connector-python-api-mysqlcursor-execute.html',CONNECTOR+'connector-python-api-mysqlcursor-fetchall.html']});

  scene('Commit or roll back',['A pending write','Successful completion','An exception'],(d,s)=>{
    title(d,'Commit or roll back');code(d,'write',['try:','    cursor.execute(sql, params)','    conn.commit()','except mysql.connector.Error:','    conn.rollback()','    raise'],95,180,32,56,s===0?1:s===1?2:4);
  },'Here sql and params represent a previously prepared INSERT, UPDATE, or DELETE and its separate values. Connector/Python disables autocommit by default, so transactional DML needs commit when the unit of work succeeds. If execution or commit raises a connector error, rollback attempts to abandon the transaction and re-raising preserves the failure for the caller. A network failure during commit can leave its outcome uncertain; do not blindly repeat non-idempotent writes. This pattern assumes a transactional engine such as InnoDB and does not make DDL rollbackable. Cleanup is handled separately in the next scene.', '39',{activity:'transactions',minutes:3,sources:[CONNECTOR+'connector-python-api-mysqlconnection-commit.html',CONNECTOR+'connector-python-api-mysqlconnection-rollback.html']});

  scene('Reliable cleanup',['A successful run','A failed run','Release resources'],(d,s)=>{
    title(d,'Reliable cleanup');
    if(s<2){flow(d,s?['Connect','Failure','Cleanup']:['Connect','Query','Cleanup'],s?1:2,265);text(d,'guarantee',640,455,'Cleanup belongs on both paths',34,P.green);}
    else code(d,'cleanup',['finally:','    try:','        if cursor is not None:','            cursor.close()','    finally:','        if conn is not None:','            conn.close()'],90,175,31,48);
  },'Initialize conn = None and cursor = None before a surrounding try, then close resources in finally so the failure path also releases them. Close the cursor before the connection. The nested try/finally ensures a cursor-close failure does not skip closing the connection. The fragment is not a standalone script; combine it with the complete error-handling example. Connector/Python also supports connection and cursor context managers, but exiting them closes resources rather than automatically committing a transaction. Do not assume every database library shares one interface. Fetch or otherwise handle pending results according to the driver’s rules.', '39',{minutes:2,sources:[CONNECTOR+'connector-python-api-mysqlcursor-close.html',CONNECTOR+'connector-python-api-mysqlconnection-close.html']});

  scene('First meeting handoff',['Review','Next practice'],(d,s)=>{
    title(d,'First meeting handoff');text(d,'review',640,210,'Restaurant normalization',40,P.green);text(d,'deadline',640,310,'Lab 03 · September 23',35,P.orange);
    if(s)text(d,'next',640,440,'Next: schema design and SQL with Python',34);
  },'The supplied September 22 material asks students to review the normalization example and lists Lab 03: Scripting as due September 23. It points to the introduction-to-databases video, a relational-database reading, and a MySQL cheatsheet in Canvas > Modules > Week 05. Preserve those as source-deck reminders; Canvas is the current course authority. Preview the next meeting’s schema practice, Python demo, and hands-on SQL. Use the next cloud/network scenes as preparation or an appendix according to available class time.', '40–41',{kind:'recap',minutes:1});

  scene('Managed cloud databases',['Provider examples','Service and engine','Shared responsibilities'],(d,s)=>{
    title(d,'Managed cloud databases');
    if(!s)table(d,'cloud',120,190,[260,390,390],[['Provider','Relational examples','Other examples'],['AWS','RDS / Aurora','DynamoDB'],['Google','Cloud SQL / Spanner','Firestore'],['Microsoft','Azure SQL','Cosmos DB']],{rowHeight:74,fontSize:27});
    if(s===1){flow(d,['Managed service','Database engine','Your schema'],1,260);text(d,'aurora',640,455,'Aurora: MySQL/PostgreSQL-compatible service',30,P.green);}
    if(s===2){text(d,'provider',330,235,'Provider',38,P.blue);text(d,'user',940,235,'Your team',38,P.green);text(d,'operations',330,365,'Service operations',31);text(d,'data',940,365,'Data, access, queries',31);}
  },'The source appendix surveys hosted relational and nonrelational services. It also names DocumentDB, Neptune, Bigtable, Oracle MySQL HeatWave, PolarDB, and other offerings; actual features and compatibility differ by product. Amazon RDS manages supported engines. Aurora is an AWS managed, MySQL/PostgreSQL-compatible engine; correct the source’s placement under “open-source/no license.” Open-source software still has a license, and a managed service can incur charges regardless of the engine’s licensing model. Oracle and SQL Server licensing options vary by engine edition and service. Managed operations do not remove the team’s responsibility for permissions, schema, application logic, or suitable backup/recovery configuration.', '42–44',{minutes:3,sources:['https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html','https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html','https://cloud.google.com/products/databases','https://azure.microsoft.com/en-us/products/category/databases/']});

  scene('Database network connections',['The destination','The service port','Access checks'],(d,s)=>{
    title(d,'Database network connections');box(d,'client',110,260,300,120,'Client',true,P.blue,38);box(d,'server',850,260,320,120,'MySQL server',true,P.green,33);
    d.arrow('connection',430,320,830,320,s===2?P.orange:P.green,5);
    text(d,'destination',640,190,s?'host:3306':'database hostname',35,P.green);
    if(s>=1)text(d,'port',640,425,'TCP port 3306',31,P.blue);
    if(s===2)text(d,'checks',640,510,'Route · firewall · TLS · authentication',30,P.orange);
  },'A hostname/IP identifies a destination and a transport protocol plus port identifies a service endpoint. MySQL commonly listens on TCP 3306; a configured server can use another port. Common examples from the source include PostgreSQL 5432, Redis 6379, MongoDB 27017, SSH 22, and HTTP/HTTPS 80/443. Correct the source’s less precise entries: Oracle’s typical listener is TCP 1521; SQL Server commonly uses TCP 1433, while its Browser service uses UDP 1434. The source’s Oracle 1830 should not be presented as the ordinary database listener. For the lab, use the instructor-provided endpoint and approved network path. Reachability, TLS trust, and database credentials are distinct checks; a firewall rule should not expose the database to every internet address by default.', '45',{minutes:3,sources:['https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ConnectToInstance.html','https://learn.microsoft.com/en-us/sql/database-engine/configure-windows/configure-a-windows-firewall-for-database-engine-access?view=sql-server-ver17']});

  scene('Schema and SQL practice',['The second meeting','Today’s work'],(d,s)=>{
    title(d,'Schema and SQL practice');text(d,'date',640,205,'September 24, 2026',34,P.muted);
    flow(d,['Design','Query','Load'],s?1:0,335);
  },'This is the second class meeting in the supplied PowerPoint. Begin with outstanding questions and move to the social-media schema exercise, repository update, SQL/Python demonstration, and data engineering practice. Students connect to the course MySQL service only using the instructor’s current configuration. The deck’s independent activity links let students explore keys, queries, transactions, normalization, and ETL without database credentials.', '46–47',{kind:'title',minutes:1});

  scene('A social application schema',['One wide table','Separate people and posts','The relationship'],(d,s)=>{
    title(d,'A social application schema');
    if(!s)table(d,'wide',120,205,[180,290,440],[['name','email','message'],['Mary','mary@example.com','I dislike snow.'],['Mary','mary@example.com','More snow today.']],{rowHeight:82,fontSize:29,highlightCols:[0,1]});
    else{table(d,'users',90,230,[140,220],[['user_id','name'],['1','Mary'],['2','Peter']],{rowHeight:65,fontSize:30});table(d,'posts',735,230,[140,140,200],[['post_id','user_id','message'],['10','1','Snow!'],['11','1','More snow.']],{rowHeight:65,fontSize:27});if(s===2)d.arrow('author',470,328,715,328,P.green,4);}
  },'Give table groups ten minutes to propose fields for users and posted messages, then explain whether one table is suitable. The source shows Mary and Peter with names, emails, messages, and dates. This adapted sample adds a second Mary post to reveal repeated profile data and uses example.com addresses. A common design gives Users a user_id and Posts a post_id, author user_id foreign key, body, and timestamp. Email uniqueness, deletion behavior, optional profiles, and multiple authors are domain decisions. Do not treat a person’s current display name as a permanent key. Ask students to state their assumptions and draw the relationship.', '48',{kind:'activity',activity:'keys',minutes:10});

  scene('Updating the course fork',['Inspect and save work','Bring upstream changes','Publish your fork'],(d,s)=>{
    title(d,'Updating the course fork');
    const lines=[['git status','git remote -v'],['git switch main','git fetch upstream','git merge upstream/main'],['git push origin main']][s];code(d,'git',lines,100,220,35,75);
    if(!s)text(d,'save',640,435,'Save your changes before switching branches',31,P.orange);
  },'These are student exercise instructions, not operations the slide performs. Inspect status, review the intended changes, and commit or otherwise preserve current work before switching branches. Verify origin points to the student’s fork and upstream to the instructor’s current course repository. Fetch downloads upstream history and merge integrates it, potentially requiring conflict resolution. Push publishes the local main branch to the fork. Correct source slide 49’s missing git before switch and its typographic command-line dashes and quotes. A clean merge often creates its own merge commit, so a second blanket commit is not inherently necessary.', '49',{kind:'activity',minutes:3,sources:['https://git-scm.com/docs/git-fetch','https://git-scm.com/docs/git-merge']});

  scene('SQL with Python demo',['Configure','Query','Explain the result'],(d,s)=>{
    title(d,'SQL with Python demo');flow(d,['Environment','Connector','Rows'],s,275);
    text(d,'question',640,190,['Which database will this reach?','Which values are parameters?','What happens if the query fails?'][s],35);
    text(d,'demo',640,465,'Course demo: SQL with Python',30,P.green);
  },'Open the current course Python/SQL example in a terminal and walk through configuration, connection, parameterized execution, result handling, and resource cleanup. Have students identify the host, database, and user without displaying the password on the projector. Run a harmless SELECT first and deliberately use a controlled invalid query to discuss the error path. The source names demo/05-sql here and demo/06-sql earlier; the companion provides local examples and should direct learners to the current course materials rather than an unverified historical path.', '50',{kind:'activity',activity:'queries',minutes:5});

  scene('ETL into related tables',['Extract JSON','Transform and validate','Load relationships'],(d,s)=>{
    title(d,'ETL into related tables');flow(d,['JSON','Python','SQL database'],s,225);
    if(s>=1)text(d,'transform',640,510,'Parse · validate · assign stable keys',30,P.green);
    if(s===2){box(d,'users',875,395,145,80,'Users',true,P.blue,27);box(d,'posts',1040,395,145,80,'Posts',true,P.green,27);}
  },'The source’s data engineering diagram extracts a JSON source, transforms it in process.py, and loads two tables in an AWS RDS SQL database. Preserve the same data flow and make the relationship explicit. Parse and validate before loading, preserve or construct stable identifiers, and load parent rows before dependent rows when foreign keys require them. Use parameterized statements and a transaction boundary appropriate to the batch. Decide what a repeated load should do so retries do not create accidental duplicate records. The ETL activity lets students vary valid/invalid records and see the effect on related tables.', '51',{activity:'etl',minutes:4});

  exercise('etl','JSON → SQL',4,
    ['Inspect rejected records. Load the sample twice.'],
    'Why are only two rows stored?','51',
    'Inspect the accepted preview and rejected records before loading. The first load commits two accepted employees. The second load conflicts with stored primary keys and rolls back the entire attempted batch, leaving the original two stored rows. Return to the course data engineering exercise and discuss the chosen behavior for repeated loads.');

  scene('Hands-on data engineering',['Schema and queries','An ETL script','A supported workspace'],(d,s)=>{
    title(d,'Hands-on data engineering');
    const prompts=['Design keys. Create tables. Query a relationship.','Validate JSON. Load related rows. Test a failure.','Use the course database and approved connection path.'];text(d,'task',640,225,prompts[s],s===2?31:34);
    flow(d,['Predict','Run','Inspect'],s,365);
  },'The source’s CS 1 exercise covers SQL schema design and querying. CS 2 covers ETL with a SQL database and Python. Give students time to test a correct input and a deliberate invalid reference, then explain whether any partial load remains. The source suggests a university HPC/VS Code workspace as an alternative client environment: start the approved workspace, clone the fork, open a terminal, and configure Python. That does not mean the HPC system is automatically the database server. Its displayed institution URL and embedded repository targets are inconsistent, so use the instructor’s current setup instructions. Confirm database endpoint, permissions, and credentials through the course channel.', '51–52',{kind:'activity',activity:'etl',minutes:12});

  scene('SQL handoff',['The assignment','Next class','An exit question'],(d,s)=>{
    title(d,'SQL handoff');text(d,'lab',640,220,'Lab 04 · Working with SQL',42,P.green);text(d,'due',640,315,'Due September 30',36,P.orange);
    if(s===1)text(d,'next',640,465,'Next: NoSQL databases',37);
    if(s===2)text(d,'question',640,465,'Which table owns each fact?',38);
  },'The supplied lecture lists Lab 04: Working with SQL as due September 30 and previews an introduction to NoSQL. It directs students to Canvas > Module 02: Week 06 for “What is a NoSQL Database?” and “What is MongoDB?” readings. Preserve these as source-deck dates and titles; Canvas is the current assignment authority. Return to the opening questions and ask students to explain one design decision using keys, dependencies, transactions, or a measured query need. The final question reconnects table design to trustworthy scripts and ETL.', '53–54',{kind:'recap',minutes:2});

  window.COURSE_DECKS=window.COURSE_DECKS||{};
  window.COURSE_DECKS[5]={id:5,title:'SQL',date:'September 22 & 24, 2026',source:'lectures/lecture-05/index.html',scenes};
})();
