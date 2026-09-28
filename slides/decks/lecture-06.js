/* Lecture 06: NoSQL. All 45 source PowerPoint slides are mapped in sourceSlides.
 * Native SVG diagrams remain editable and leave space for handwriting.
 * Code is displayed for teaching; the slide player never executes it.
 */
(function () {
  'use strict';
  const P=window.DeckViz.palette,scenes=[];
  const MONGO='https://www.mongodb.com/docs/manual/';
  const title=(d,value)=>d.text('heading',80,88,value,46,P.ink,'start',650);
  const text=(d,k,x,y,value,size=30,color=P.ink)=>d.text(k,x,y,value,size,color);
  function code(d,k,lines,x=95,y=190,size=31,gap=45,active=-1,w=1080) {
    lines.forEach((line,i)=>{
      if(i===active)d.rect(k+'-active-'+i,x-12,y+i*gap-21,w,42,P.greenLight,'none',4,0);
      d.add(k+'-'+i,'text',{x,y:y+i*gap,fill:i===active?P.green:P.ink,'font-size':size,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-anchor':'start','dominant-baseline':'middle','xml:space':'preserve'},line);
    });
  }
  function box(d,k,x,y,w,h,label,active=false,color=P.green,size=30) {
    const fill=color===P.blue?P.blueLight:color===P.orange?P.orangeLight:color===P.red?P.redLight:P.greenLight;
    d.box(k,x,y,w,h,label,active?fill:P.white,active?color:P.line,size);
  }
  function flow(d,labels,active,y=280) {
    const w=labels.length===2?360:230,gap=100,x=(1280-(labels.length*w+(labels.length-1)*gap))/2;
    labels.forEach((label,i)=>{
      box(d,'flow-'+i,x+i*(w+gap),y,w,92,label,i===active);
      if(i<labels.length-1)d.arrow('flow-edge-'+i,x+i*(w+gap)+w+12,y+46,x+(i+1)*(w+gap)-12,y+46,P.green,4);
    });
  }
  function table(d,k,x,y,widths,rows,options={}) {d.table(k,x,y,widths,rows,Object.assign({rowHeight:58,fontSize:29},options));}
  function node(d,k,x,y,label,active=false) {d.circle(k,x,y,54,active?P.greenLight:P.white,active?P.green:P.line,3);text(d,k+'-label',x,y,label,28);}
  function scene(name,states,draw,teaching,sourceSlides,extra={}) {
    const sourceNumbers=sourceSlides.split(',').flatMap(part=>{const ends=part.trim().split(/[–-]/).map(Number);return ends.length===1?ends:Array.from({length:ends[1]-ends[0]+1},(_,i)=>ends[0]+i);});
    const notes=['Main idea: '+teaching.idea,...teaching.builds.map((value,i)=>'Step '+(i+1)+': '+value),'Ask the class: '+teaching.question,'Expected answer: '+teaching.answer,...(teaching.context?['Teaching context: '+teaching.context]:[]),'Source PowerPoint slides '+sourceSlides+'.'].join('\n\n');
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

  scene('NoSQL',['The lecture','The route'],(d,s)=>{
    d.text('course',80,135,'DS 2022',30,P.green,'start',650);d.text('name',80,235,'NoSQL',88,P.ink,'start',650);
    d.text('date',80,330,'September 29 & October 1, 2026',30,P.muted,'start');
    if(s){text(d,'shape',250,455,'Shape',35);text(d,'model',640,455,'Model',35);text(d,'behavior',1030,455,'Behavior',35);}
  },{
    idea:'NoSQL design starts with the shape of the data, the questions we ask, and the behavior we require.',
    builds:['Point to NoSQL and connect it to the SQL lecture: we still need identifiers, relationships, and dependable updates. Read the dates as the two class meetings.','Point to Shape, Model, and Behavior in order. Explain that we will read nested data, choose representations, and investigate what applications see while copies catch up.'],
    question:'Which design question from SQL still matters when we store documents?',
    answer:'We still need to decide how records are identified, how they relate, and which updates and queries must work correctly.',
    context:'The second meeting begins at NoSQL practice. Timings include discussion and exercise breaks across both meetings.'
  },'1–2',{kind:'title',minutes:1});

  scene('Exam 1',['When and where','What to prepare'],(d,s)=>{
    title(d,'Exam 1');text(d,'date',640,210,'October 8 · in class · 50 minutes',40,P.green);
    if(s===0){text(d,'format',640,325,'Multiple choice · pencil and paper',34);text(d,'rules',640,440,'No notes, phones, or online resources',32,P.orange);}
    else{box(d,'modules',180,295,920,110,'Modules 1–2 · Weeks 1–6',true,P.blue,40);text(d,'predict',640,480,'Predict what commands and systems do',33);}
  },{
    idea:'Prepare for the exam by predicting behavior rather than memorizing isolated command names.',
    builds:['Read the October 8 date, in-class location, and fifty-minute duration. Point to the paper format and the listed resource restrictions.','Point to Modules 1–2 and Weeks 1–6. Ask students to identify one command or database concept they can explain by predicting a small example.'],
    question:'What should you practice doing with a command you recognize?',
    answer:'Predict its effect on files, repositories, or data, and explain why that effect follows from the command and its inputs.',
    context:'These exam details are carried from the source lecture. Confirm current arrangements and any approved accommodations through the instructor and Canvas.'
  },'3',{kind:'recap',minutes:2});

  scene('Overwrite a file',['First command','Second command','Third command'],(d,s)=>{
    title(d,'Overwrite a file');code(d,'commands',['date > file1','date > file1','date > file1'],90,215,34,70,s,475);
    d.arrow('write',590,285,740,285,P.green,4);box(d,'file',780,180,380,230,'',true,P.blue);
    text(d,'filename',970,220,'file1',32,P.blue);text(d,'content',970,315,['09:00:00','09:00:01','09:00:02'][s],36);
    text(d,'rule',970,465,'> replaces content',31,P.orange);
  },{
    idea:'Output redirection with > replaces an existing file’s contents before writing the new output.',
    builds:['Read the first command and point to the single time in file1. Explain that these shortened times stand in for complete date output.','Point to the highlighted second command, then to the changed file content. The first output has been replaced rather than kept above the new one.','Read the third command and point to the remaining time. Only the third command’s output remains in this sequential example.'],
    question:'After all three commands, how many date outputs are in file1?',
    answer:'One: the output from the final command. Each > opens the file for replacement.',
    context:'Assume all commands succeed, run in the same directory, and normal Bash redirection is enabled. With noclobber enabled, overwriting an existing regular file can instead fail. https://www.gnu.org/software/bash/manual/html_node/Redirections.html'
  },'4',{minutes:3});

  scene('Append a file',['First output','Append again','Keep all three'],(d,s)=>{
    title(d,'Append a file');code(d,'commands',['date >> file1','date >> file1','date >> file1'],90,215,34,70,s,475);
    d.arrow('write',590,285,740,285,P.green,4);box(d,'file',780,180,380,265,'',true,P.blue);text(d,'filename',970,220,'file1',32,P.blue);
    ['09:00:00','09:00:01','09:00:02'].slice(0,s+1).forEach((v,i)=>text(d,'content-'+i,970,285+i*58,v,35));
    text(d,'rule',970,490,'>> appends content',31,P.orange);
  },{
    idea:'Output redirection with >> adds new output at the end of a file.',
    builds:['Read the first command with two greater-than signs. Start from an absent or empty file so the single displayed output is the first entry.','Point to the second time below the first. The second command adds its output without removing the existing content.','Count the three outputs and compare this file with the previous slide. Changing one redirection operator changes the final file.'],
    question:'What changes if file1 already contains an earlier line before these commands?',
    answer:'That earlier line remains, and the three new date outputs are appended after it.',
    context:'The starting file is empty for this animation; it does not continue the previous slide’s file state. https://www.gnu.org/software/bash/manual/html_node/Redirections.html'
  },'4',{minutes:2});

  scene('Make a repository copy',['Choose all that apply','Reveal the copies'],(d,s)=>{
    title(d,'Make a repository copy');
    ['git clone','git pull','git commit','git add','Fork on GitHub'].forEach((v,i)=>box(d,'choice-'+i,95+(i%3)*395,200+Math.floor(i/3)*155,340,100,v,s===1&&(i===0||i===4),P.green,31));
    if(s){text(d,'local-scope',265,328,'Local repository',27,P.muted);text(d,'github-scope',660,492,'GitHub repository',27,P.muted);}
  },{
    idea:'Cloning and forking create repository copies, while pull, commit, and add act on an existing repository.',
    builds:['Read all five choices and ask students to select every operation that creates another repository copy. Give them a moment to distinguish local and GitHub copies.','Point to git clone and Fork on GitHub. Explain that clone creates a local repository, while a GitHub fork creates a repository associated with the original on GitHub.'],
    question:'Why is git pull not another correct answer?',
    answer:'Pull fetches changes and integrates them into an existing local repository; it does not create a new repository copy.',
    context:'Git add stages changes; git commit records a snapshot in the current repository. Cloning need not involve GitHub. https://git-scm.com/docs/git-clone ; https://git-scm.com/docs/git-pull ; https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/about-forks'
  },'5',{minutes:3});

  scene('Review by predicting',['Commands and environments','Data and systems'],(d,s)=>{
    title(d,'Review by predicting');
    const rows=s===0?[['Bash / Git','What changes?'],['PATH / shebang','What runs?'],['Directories / environment','What is visible?']]:[['Pipelines / ETL','Where does data move?'],['Keys / normalization','Where does a fact belong?'],['SQL / NoSQL / formats','How is data represented?']];
    table(d,'review',100,200,[485,595],[['Topic','Prediction'],...rows],{rowHeight:73,fontSize:29});
  },{
    idea:'A useful review connects each course topic to a concrete prediction about a system.',
    builds:['Read each command-and-environment pair. Ask students to sketch one example involving a command, its options, and the files or environment it can see.','Read each data-and-systems pair. Connect source control, pipelines, platforms, database connections, and flat versus nested formats to the examples already studied.'],
    question:'How could you test whether you understand PATH?',
    answer:'Predict which executable a command name resolves to from the ordered PATH entries, then explain how changing that order changes the result.',
    context:'Use the source review list as a checklist, including command/subcommand/option distinctions, environment variables, directory trees, shebangs, data pipelines, database connections, normalization, and SQL operations. Canvas defines the current exam scope.'
  },'6',{minutes:2});

  scene('Hierarchical formats',['One nested idea','Four representations'],(d,s)=>{
    title(d,'Hierarchical formats');box(d,'student',450,175,380,90,'Student',true,P.green,36);
    ['Name','Courses'].forEach((v,i)=>{d.arrow('branch-'+i,640,275,375+i*530,350,P.green,3);box(d,'child-'+i,210+i*530,355,330,85,v,true,P.blue,33);});
    if(s)text(d,'formats',640,505,'JSON · XML · YAML · TOML',35,P.green);
  },{
    idea:'Hierarchical formats represent values inside named containers rather than only in flat rows.',
    builds:['Point to Student and follow the two branches to Name and Courses. Ask which child might contain more than one value.','Read the four format names. Explain that each can represent structured data, but its syntax and common uses differ.'],
    question:'Which part of this student example naturally needs a list?',
    answer:'Courses needs a list because a student can take several courses.',
    context:'A file format does not by itself determine a database model or a validation policy. We will use a small student example to compare the representations.'
  },'7',{minutes:2});

  scene('JSON objects',['An object','Names and values','A nested object'],(d,s)=>{
    title(d,'JSON objects');code(d,'json',['{','  "name": "Alice",','  "age": 21,','  "address": {"city": "Charlottesville"}','}'],90,195,31,58,[0,1,3][s]);
    text(d,'caption',640,510,['{ } encloses an object','A name maps to a value','An object can contain another object'][s],33,P.green);
  },{
    idea:'A JSON object groups named values, and a value can itself be another object.',
    builds:['Point to the opening and closing braces. Read the entire object as one student record rather than five separate records.','Point to name and its string value, then age and its number. Emphasize the double quotes around property names and strings, but not around the number.','Follow address to the nested city property. Explain that the inner object keeps address details together under one outer property.'],
    question:'Is the value of address a string or an object here?',
    answer:'It is an object containing the city property; the value of city is a string.',
    context:'The displayed example is valid JSON. JSON also supports arrays, booleans, and null. Property names should be unique for interoperable handling. https://www.rfc-editor.org/rfc/rfc8259'
  },'8',{activity:'json',minutes:3});

  scene('JSON arrays',['An ordered list','Index zero','Index one'],(d,s)=>{
    title(d,'JSON arrays');code(d,'json',['{','  "courses": ["DS2022", "CS1110"]','}'],90,180,33,52,1);
    ['DS2022','CS1110'].forEach((v,i)=>{box(d,'item-'+i,295+i*405,355,285,92,v,s===i+1,P.green,35);text(d,'index-'+i,437+i*405,485,String(i),30,P.muted);});
  },{
    idea:'A JSON array is an ordered list whose positions are commonly addressed with zero-based indexes.',
    builds:['Point to the square brackets around courses. Read the two course values in order and distinguish the array from the outer object.','Point to index 0 beneath DS2022. Explain that the first position is zero when accessing this parsed array in Python or JavaScript.','Point to index 1 beneath CS1110. Ask students to count positions rather than assuming that the first element has index one.'],
    question:'Which value is at courses[1] after parsing this JSON?',
    answer:'CS1110 is at index 1; DS2022 is at index 0.',
    context:'JSON defines an ordered array; indexing is an operation in the language or query tool that consumes it. Unlike an array, JSON object member order should not be used as a portable data contract. https://www.rfc-editor.org/rfc/rfc8259'
  },'8',{activity:'json',minutes:2});

  scene('Follow a JSON path',['Start at the root','Choose the property','Choose the item'],(d,s)=>{
    title(d,'Follow a JSON path');
    box(d,'root',110,230,265,90,'student',s===0);box(d,'courses',490,230,280,90,'courses',s===1);box(d,'value',895,230,275,90,'CS1110',s===2);
    d.arrow('property-edge',390,275,475,275,P.green,3);d.arrow('index-edge',785,275,880,275,P.green,3);
    text(d,'property-label',430,215,'key',24,P.muted);text(d,'index-label',835,215,'[1]',25,P.muted);
    code(d,'path',['student["courses"][1]'],325,445,36,45,-1,780);
  },{
    idea:'A path reaches a nested value by choosing one object property or array position at each step.',
    builds:['Point to student as the parsed root value. Read the expression from left to right before revealing which part of the route is active.','Point to courses and read the quoted property lookup. The result at this point is an array, so there is still another step.','Point to CS1110 and read the final index lookup. The complete expression now reaches one string rather than the whole array.'],
    question:'What would student["courses"] return without the final [1]?',
    answer:'It would return the full two-element courses array.',
    context:'The expression is Python/JavaScript-style access to parsed data, not JSON syntax itself. Different path query tools have their own syntax and missing-value behavior.'
  },'8, 13',{activity:'json',minutes:2});

  scene('XML elements',['An element','Nested elements','Repeated children'],(d,s)=>{
    title(d,'XML elements');code(d,'xml',['<student>','  <name>Alice</name>','  <courses>','    <course>DS2022</course>','    <course>CS1110</course>','  </courses>','</student>'],90,185,30,46,[0,1,4][s]);
    text(d,'caption',995,300,['Tags','Nesting','Repeated tags'][s],33,P.green);
  },{
    idea:'XML uses named elements and matching tags to represent structured content.',
    builds:['Point to student’s opening and closing tags. Explain that the entire example is one element containing other elements.','Read the name element and point to its text content. Follow the indentation to see that name belongs inside student.','Point to the two course elements inside courses. Repeating a child element represents multiple course entries.'],
    question:'Which closing tag matches the opening <courses> tag?',
    answer:'The </courses> tag closes that container after both course elements.',
    context:'This is valid XML with one root element. XML can also include attributes, namespaces, and mixed content; validation requires declared rules such as an XML Schema or DTD. HTML has its own defined semantics rather than being a general substitute for arbitrary XML. https://www.w3.org/TR/xml/'
  },'9',{minutes:2});

  scene('YAML indentation',['A mapping','A nested list'],(d,s)=>{
    title(d,'YAML indentation');code(d,'yaml',['student:','  name: Alice','  age: 21','  courses:','    - DS2022','    - CS1110'],100,195,33,51,s?4:1);
    box(d,'meaning',810,260,345,110,s?'List entries':'Nested mapping',true,P.green,30);
  },{
    idea:'YAML often uses indentation and list markers to make nested mappings and sequences readable.',
    builds:['Point to name, age, and courses at the same indentation beneath student. Explain that each is part of the student mapping.','Point to the dashes beneath courses. Read those entries as one sequence whose indentation places it inside the courses property.'],
    question:'What tells us that DS2022 belongs to courses rather than being another student property?',
    answer:'Its dash marks a sequence entry, and its deeper indentation places that sequence under courses.',
    context:'This example uses spaces, not indentation tabs. YAML supports additional syntax and type rules, so use the parser and version required by a project. It is common in configuration, but it is not limited to that use. https://yaml.org/spec/1.2.2/'
  },'10',{minutes:2});

  scene('TOML configuration',['A named table','Scalar values','An array value'],(d,s)=>{
    title(d,'TOML configuration');code(d,'toml',['[project]','name = "my-data-project"','version = "0.1.0"','requires-python = ">=3.11"','dependencies = ["pandas", "numpy"]'],90,200,31,59,[0,2,4][s]);
    text(d,'file',1040,510,'pyproject.toml',29,P.green);
  },{
    idea:'TOML uses named tables and key-value assignments for structured configuration.',
    builds:['Read the project header in square brackets. Explain that it starts a TOML table; here the brackets do not mean the same thing as JSON array brackets.','Point to name and version and read their quoted string values. The equals sign associates each key with a value.','Point to dependencies and read the two array entries. Explain that the surrounding project configuration determines how these names are used.'],
    question:'Which line contains an array rather than a scalar string?',
    answer:'The dependencies line contains an array of two package-name strings.',
    context:'All quotes in this example are ASCII quotes. A complete packaged Python project may also declare a build-system table; its backend and version requirements depend on that project. TOML tables are explicit and are not defined by indentation. https://toml.io/en/v1.0.0 ; https://packaging.python.org/en/latest/guides/writing-pyproject-toml/'
  },'11',{minutes:2});

  scene('Format and validation',['The formats','Check at write time','Interpret at read time'],(d,s)=>{
    title(d,'Format and validation');
    if(s===0){table(d,'formats',175,185,[255,675],[['Format','Common use'],['JSON','APIs and document exchange'],['XML','Structured documents'],['YAML / TOML','Configuration']],{rowHeight:70,fontSize:31});}
    else{flow(d,s===1?['Incoming data','Validation','Stored data']:['Stored data','Interpretation','Result'],1,245);text(d,'policy',640,425,s===1?'Schema on write':'Schema on read',37,P.green);text(d,'separate',640,500,'Format does not choose the policy',31,P.muted);}
  },{
    idea:'A representation format and the point at which a system enforces structure are separate choices.',
    builds:['Read the formats and their common uses. Explain that these are patterns of use, not restrictions on what each format can express.','Follow incoming data through validation before it is accepted. Call this schema on write: declared checks can reject a write that does not fit.','Follow stored data through interpretation during a read. Explain that schema on read applies a structure when consuming data, and that a system can combine read-time interpretation with write-time checks.'],
    question:'Does storing JSON mean that a database cannot validate incoming data?',
    answer:'No. JSON is a format; a database can validate JSON-like documents against declared rules before accepting them.',
    context:'MongoDB supports collection validation despite flexible document structure. Neither schema on read nor schema on write is synonymous with JSON, NoSQL, or relational storage. '+MONGO+'core/schema-validation/'
  },'12',{minutes:3});

  exercise('json','JSON paths',5,['Inspect $.phones[1].number.','Compare $.phones[2].number.'],'How do null and missing differ?','13',{
    idea:'Trace a nested lookup one container at a time before checking its result.',
    builds:['Open JSON paths with the green ↗ link and allow five minutes. Reset, inspect the phones array, then enter $.phones[1].number and select Inspect; repeat with $.phones[2].number. Return ready to explain the zero-based indexes and why an explicit null differs from a missing path.'],
    question:'How do the results at phones[1].number and phones[2].number differ in the starting document?',
    answer:'The first path reaches an explicitly stored null; the second does not exist because the array has no item at index 2.',
    context:'The direct activity is a browser simulation. The source also points students to the course repository’s JSON practice; use the current companion and repository instructions for that exercise.'
  });

  scene('Four NoSQL families',['Key–value','Document','Wide-column','Graph'],(d,s)=>{
    title(d,'Four NoSQL families');
    ['Key–value','Document','Wide-column','Graph'].forEach((v,i)=>box(d,'family-'+i,130+(i%2)*555,190+Math.floor(i/2)*175,465,115,v,i===s,P.green,37));
    text(d,'meaning',640,535,'NoSQL: “not only SQL”',29,P.muted);
  },{
    idea:'NoSQL names several data-model families rather than one uniform database design.',
    builds:['Point to Key–value and describe looking up a value by an identifying key. Redis is a familiar example, though real products may support several models.','Point to Document and describe a record containing named fields, nested objects, and arrays. MongoDB is our main example for the hands-on work.','Point to Wide-column and describe rows organized around partition keys and related columns. We will use Cassandra’s partition and clustering-key model.','Point to Graph and describe nodes connected by relationships. The useful model depends on the questions the application repeatedly asks.'],
    question:'Does the word NoSQL tell us whether a system supports transactions?',
    answer:'No. Transaction behavior is a separate system capability and configuration choice, not a consequence of the NoSQL label.',
    context:'The relational model remains a useful comparison. Product categories overlap: DynamoDB supports key-value and document models, and many databases offer additional models or query interfaces. Avoid reading the four boxes as mutually exclusive product lists.'
  },'14–16',{minutes:3});

  scene('Key–value lookup',['Store pairs','Choose a key','Return its value'],(d,s)=>{
    title(d,'Key–value lookup');table(d,'pairs',125,200,[360,650],[['Key','Value'],['flavor','vanilla'],['fruit-set','[apples, bananas, grapes]'],['session:42','{user: Alice}']],{rowHeight:70,fontSize:31,highlightRows:s?[1]:[]});
    if(s===1)text(d,'query',640,520,'GET flavor',34,P.green);
    if(s===2)text(d,'result',640,520,'→ vanilla',35,P.green);
  },{
    idea:'A key–value lookup retrieves the value associated with one key.',
    builds:['Read the three key-value pairs. Explain that the value can be simple or structured, depending on the database’s supported data types.','Point to GET flavor and the highlighted flavor row. Ask students to predict which value the lookup will return.','Read vanilla as the result. The client supplied the key rather than searching every word in every value.'],
    question:'What identifies the value vanilla in this store?',
    answer:'The key flavor identifies it.',
    context:'The table is illustrative, not a universal key-value API or valid JSON file. Redis is one example with specialized value types and commands; other systems expose different operations.'
  },'17',{minutes:2});

  scene('Documents keep related fields',['Nested fields','Arrays of values','Different optional fields'],(d,s)=>{
    title(d,'Documents keep related fields');
    code(d,'first',['{','  "name": "Cafe A",','  "address": {"city": "Brooklyn"},','  "grades": ["A", "B"]','}'],85,195,27,55,s===0?2:s===1?3:-1,610);
    if(s===2)code(d,'second',['{','  "name": "Cafe B",','  "patio": true','}'],800,220,27,55,2,370);
  },{
    idea:'A document can keep nested objects and lists within one record while allowing declared variations between records.',
    builds:['Point to address inside Cafe A. Explain that city is stored within a nested address object instead of in a separate flat column in this example.','Point to grades and read its two entries in order. The grades array belongs to this restaurant document.','Point to Cafe B and its patio field. Explain that a document collection can permit optional fields, while application rules or database validation can still require particular structure.'],
    question:'Does Cafe B’s missing grades field mean its grades value is an empty array?',
    answer:'No. A missing field and an explicitly stored empty array are different states.',
    context:'The restaurants are small illustrative records inspired by the source screenshot; they are not claims about actual businesses. MongoDB stores BSON documents and supports collection validation. '+MONGO+'core/document/ ; '+MONGO+'core/schema-validation/'
  },'18',{minutes:3});

  scene('Partitions and clustering',['Choose a partition','Order within it','Distribute partitions'],(d,s)=>{
    title(d,'Partitions and clustering');
    code(d,'primary',['PRIMARY KEY ((sensor, day), timestamp)'],90,155,29,45,-1,1090);
    table(d,'sensors',80,220,[155,235,190,145],[['sensor','day','timestamp','value'],['1','2026-09-29','09:00','20.1'],['1','2026-09-29','09:01','20.3'],['1','2026-09-30','09:00','19.9'],['2','2026-09-30','09:00','22.4']],{rowHeight:56,fontSize:27,highlightCols:s===0?[0,1]:s===1?[2]:[],highlightRows:s===2?[1,2]:[]});
    if(s<2)text(d,'key-caption',1020,340,s===0?'Partition key':'Clustering key',29,P.green);
    else{box(d,'node-1',960,255,235,90,'Node 1',true,P.green,30);box(d,'node-2',960,405,235,90,'Node 2',true,P.blue,30);d.arrow('partition-1',825,332,942,300,P.green,3);d.arrow('partition-2',825,416,942,445,P.blue,3);d.arrow('partition-3',825,472,942,465,P.blue,3);}
  },{
    idea:'A Cassandra partition key groups rows, while clustering columns order rows within each partition.',
    builds:['Point to the double parentheses around sensor and day. Highlight the two rows that share both values: they belong to one partition even though their timestamps differ.','Point to timestamp in the primary-key declaration and the ordered times inside that partition. This clustering column distinguishes and orders the readings within the sensor-day group.','Follow each group toward its node. Explain that partition placement distributes groups; it does not split the temperature column away from every other column.'],
    question:'Do sensor 1’s readings on September 29 and September 30 belong to the same partition here?',
    answer:'No. The partition key includes both sensor and day, so changing the day creates a different partition.',
    context:'The node placement is illustrative and omits replication and hashing details. Cassandra CQL tables declare typed columns; wide-column does not mean that every such system lacks a schema. The full primary key includes partition and clustering components. https://cassandra.apache.org/doc/latest/cassandra/developing/cql/ddl.html'
  },'19',{minutes:4});

  scene('Three storage ideas',['Row-oriented','Analytical columns','Wide-column partitions'],(d,s)=>{
    title(d,'Three storage ideas');
    if(s<2){table(d,'readings',280,205,[230,250,240],[['sensor','time','temp'],['1','09:00','20.1'],['2','09:00','22.4'],['1','09:01','20.3']],{rowHeight:65,fontSize:31,highlightRows:s===0?[1]:[],highlightCols:s===1?[2]:[]});text(d,'label',640,510,s===0?'One record’s fields together':'One field across many records',33,P.green);}
    else{box(d,'partition-a',90,215,510,205,'',true,P.green);box(d,'partition-b',680,215,510,205,'',true,P.blue);text(d,'a-key',345,265,'Partition: sensor 1, day 29',30);text(d,'a-first',345,330,'09:00 → 20.1',30);text(d,'a-second',345,382,'09:01 → 20.3',30);text(d,'b-key',935,265,'Partition: sensor 2, day 30',30);text(d,'b-values',935,350,'09:00 → 22.4',30);text(d,'label',640,510,'Partition keys shape access',33,P.green);}
  },{
    idea:'Wide-column data models and analytical column-oriented storage describe different design choices.',
    builds:['Point across the highlighted row. Explain why keeping one record’s fields together can suit operations that read or update whole records.','Point down the highlighted temperature column. Explain why scanning selected fields across many rows can suit analytical aggregates.','Point to the partition labels and the time-ordered values inside each group. Return to the sensor-day access pattern rather than equating this layout with analytical column storage.'],
    question:'Which design idea most directly helps the query “read this sensor’s readings for this day”?',
    answer:'The sensor-day partition groups the relevant readings, with timestamps ordering them within that partition.',
    context:'These are conceptual layouts, not storage-engine diagrams. Products combine techniques, and performance depends on workload, indexes, compression, and implementation. Cassandra is wide-column; systems such as analytical warehouses may use column-oriented storage without sharing Cassandra’s data model. https://cassandra.apache.org/doc/latest/cassandra/developing/cql/ddl.html'
  },'20',{minutes:3});

  scene('Graph relationships',['Nodes and edges','One hop','Two hops'],(d,s)=>{
    title(d,'Graph relationships');
    d.line('alice-bob',295,265,585,265,s>=1?P.green:P.line,s>=1?6:3);d.line('bob-cara',695,265,985,265,s===2?P.green:P.line,s===2?6:3);d.line('alice-drew',275,305,555,420,P.line,3);
    node(d,'alice',240,265,'Alice',true);node(d,'bob',640,265,'Bob',s>=1);node(d,'cara',1040,265,'Cara',s===2);node(d,'drew',600,445,'Drew');
    text(d,'relationship',440,210,'KNOWS',26,P.muted);text(d,'hop',1010,460,['Nodes + edges','One hop','Two hops'][s],32,P.green);
  },{
    idea:'A graph represents entities as nodes and relationships as edges that a query can follow.',
    builds:['Point to the four people as nodes and the connecting lines as relationships. Read KNOWS as the relationship type for this illustrative undirected network.','Follow the highlighted edge from Alice to Bob. Explain that this is one hop through the graph.','Follow the next highlighted edge from Bob to Cara. The route reaches Cara in two hops even though Alice and Cara have no direct edge.'],
    question:'Which person on the highlighted route is two hops from Alice?',
    answer:'Cara is two hops from Alice through Bob.',
    context:'Nodes are also called vertices; relationships are edges. Real graph models may use directed and typed edges with properties. The value of a graph database depends on the traversals and workload, not a universal claim of superior speed.'
  },'21',{activity:'graph',minutes:3});

  exercise('graph','Follow relationships',5,['Find Maya → Rowan.','Follow arrow directions only.'],'Why did the path disappear?','21',{
    idea:'A graph query’s starting point and direction rules determine which paths it can follow.',
    builds:['Open Follow relationships with the green ↗ link and allow five minutes. Reset with Maya as the start and Rowan as the destination, then select Find shortest path; to inspect individual steps afterward, select Restart search and then Step search. Turn on Follow arrow directions only and search again, then return ready to explain why the path disappeared.'],
    question:'Why does following arrow directions make Rowan unreachable from Maya in this graph?',
    answer:'The READ and WROTE edges point into books, so following those arrows from a reader reaches a book but cannot leave it to reach an author.',
    context:'The activity is a small graph simulation. Treat its edge directions and relationship rules as part of that particular model.'
  });

  scene('Time-series data',['Timestamped measurements','A new reading','A windowed question'],(d,s)=>{
    title(d,'Time-series data');
    d.line('x-axis',160,435,1130,435,P.muted,3);d.line('y-axis',160,435,160,185,P.muted,3);text(d,'temperature',160,150,'Temperature',27,P.muted);text(d,'time',1140,480,'Time',27,P.muted);
    const points=[[250,355],[455,325],[660,345],[865,245],[1060,210]],count=s?5:4;
    for(let i=0;i<count;i++){if(i)d.line('segment-'+i,...points[i-1],...points[i],P.green,4);d.circle('point-'+i,points[i][0],points[i][1],9,P.green);text(d,'tick-'+i,points[i][0],480,['09:00','09:01','09:02','09:03','09:04'][i],24,P.muted);}
    if(s===2){d.rect('window',620,175,500,250,'none',P.orange,5,3);text(d,'query',865,155,'Recent maximum?',30,P.orange);}
  },{
    idea:'Time-series data organizes observations around timestamps so we can ask how values change over time.',
    builds:['Point to the time axis and the sequence of measurements. Explain that the positions show the order and changing temperature of one illustrative sensor.','Point to the newly added 09:04 reading. The next observation extends the series rather than replacing the earlier measurements.','Point to the outlined recent window and ask for its largest reading. Time-range filters, aggregates, and retention policies are common concerns for these datasets.'],
    question:'Why does a recent-maximum query need timestamps as well as temperatures?',
    answer:'Timestamps identify which measurements belong inside the requested recent interval.',
    context:'The values are illustrative and the vertical scale is intentionally qualitative. The source’s image is an old database-popularity chart, not current evidence about product rankings. Time-series capabilities can exist in both relational and NoSQL systems.'
  },'22',{minutes:2});

  scene('Append history and project state',['Created','Processing','Shipped'],(d,s)=>{
    title(d,'Append history and project state');text(d,'order',640,165,'Order 123',34,P.green);
    ['CREATED','PROCESSING','SHIPPED'].slice(0,s+1).forEach((v,i)=>{box(d,'event-'+i,95+i*400,230,285,90,v,i===s,P.blue,29);if(i)d.arrow('event-edge-'+i,395+(i-1)*400,275,480+(i-1)*400,275,P.green,3);});
    d.arrow('projection-edge',640,335,640,385,P.green,3);box(d,'current',360,405,560,85,'Current status: '+['CREATED','PROCESSING','SHIPPED'][s],true,P.green,30);
    if(s===2)text(d,'consumers',640,535,'Email · Billing · Analytics',27,P.muted);
  },{
    idea:'An append-only event history can produce a current-state view while preserving earlier events.',
    builds:['Point to the CREATED event and the current status below it. Explain that the lower box is a projection of the events known so far.','Point to the newly appended PROCESSING event. The current status changes, while the original CREATED event remains in the history.','Point to SHIPPED and then to the three consumers. Different consumers can use the same event history to update a current view or trigger their own work.'],
    question:'Why keep the CREATED event after the current status becomes SHIPPED?',
    answer:'It preserves how the order reached its current state and supports auditing, reconstruction, or other event consumers.',
    context:'An append log alone does not guarantee cryptographic tamper evidence, exactly-once delivery, or successful consumer processing. Those require additional mechanisms and guarantees. The diagram illustrates the source’s order-history pattern without recommending a particular ledger service.'
  },'23',{minutes:3});

  scene('Vector similarity',['Represent items','Place a query','Find nearby vectors'],(d,s)=>{
    title(d,'Vector similarity');d.line('x-axis',185,460,1120,460,P.muted,3);d.line('y-axis',185,460,185,165,P.muted,3);
    [[400,295,'Book A'],[570,245,'Book B'],[950,385,'Book C']].forEach(([x,y,label],i)=>{d.circle('item-'+i,x,y,12,s===2&&i<2?P.green:P.blue);text(d,'item-label-'+i,x,y+38,label,27);});
    if(s){d.circle('query',495,325,13,P.orange);text(d,'query-label',495,390,'Query',29,P.orange);}
    if(s===2){d.line('near-a',490,318,412,299,P.green,4);d.line('near-b',505,316,560,255,P.green,4);}
    text(d,'limit',970,505,'Similarity ≠ truth',29,P.muted);
  },{
    idea:'Vector search finds nearby representations under a chosen similarity measure.',
    builds:['Point to the three item positions. Explain that an embedding represents an item with numbers; this drawing shows only two illustrative dimensions.','Point to Query and explain that the query must be represented in a compatible vector space. Its location lets a system compare it with the stored items.','Follow the two highlighted connections to nearby items. Explain that a nearest-neighbor result is a similarity candidate, not proof that an item is accurate or relevant to every task.'],
    question:'Does being close to the query guarantee that Book A contains a true answer?',
    answer:'No. Similarity reflects the representation and metric; the content still needs evaluation for the task.',
    context:'Real embeddings often have many dimensions, and search may use cosine similarity, dot product, or Euclidean distance depending on the model and index. The diagram is qualitative and does not claim a production ranking.'
  },'24',{minutes:2});

  scene('MongoDB documents',['A logical record','JSON representation','BSON storage'],(d,s)=>{
    title(d,'MongoDB documents');
    if(s===0){box(d,'record',320,210,640,210,'',true,P.green);text(d,'name',640,270,'Jane Austen',42);text(d,'kind',640,355,'Author',32,P.muted);}
    else if(s===1)code(d,'json',['{','  "_id": "author_001",','  "name": "Jane Austen"','}'],160,210,37,64);
    else{flow(d,['Application','BSON document','MongoDB'],1,245);text(d,'binary',640,430,'Binary representation + typed values',33,P.green);}
  },{
    idea:'MongoDB stores BSON documents, which represent records with named values and nested structure.',
    builds:['Point to the author card and identify the logical record: one author with a name. Separate the idea of that record from the format used to display or store it.','Read the valid JSON representation and point to the chosen author identifier. The same logical information can be serialized in text for exchange.','Follow the application through the BSON document to MongoDB. Explain that BSON is a binary document representation with types beyond ordinary JSON.'],
    question:'Does MongoDB store this author as the literal XML or JSON text shown on a slide?',
    answer:'No. MongoDB stores a BSON document; clients and tools can display or exchange representations of its values.',
    context:'The source uses XML and JSON illustrations of a person before introducing BSON. XML must be parsed and mapped if an application wants equivalent MongoDB fields; it is not MongoDB’s native document format. '+MONGO+'core/document/'
  },'25–27',{minutes:3});

  scene('BSON has additional types',['Familiar values','A date value','An identifier value'],(d,s)=>{
    title(d,'BSON has additional types');
    if(s===0){table(d,'types',225,205,[410,420],[['Value','Type'],['"Jane Austen"','String'],['1813','Integer'],['true','Boolean']],{rowHeight:68,fontSize:32});}
    else{const lines=s===1?['{','  publishedAt: ISODate("1813-01-28T00:00:00Z")','}']:['{','  _id: ObjectId("507f1f77bcf86cd799439011")','}'];code(d,'typed',lines,90,250,32,65);text(d,'notation',640,475,'mongosh display notation',29,P.muted);}
  },{
    idea:'BSON preserves typed values such as dates and ObjectIds in addition to familiar strings, numbers, and arrays.',
    builds:['Read each displayed value and type. Explain that typed values affect comparison, sorting, and the operations a database can perform.','Point to ISODate and explain that this represents a BSON date in mongosh notation. A date-looking JSON string does not automatically become a BSON date.','Point to ObjectId and the hexadecimal display. Explain that ObjectId is a BSON type rather than simply a twenty-four-character JSON string.'],
    question:'Are "1813-01-28" and a BSON date necessarily the same stored type?',
    answer:'No. One is a string unless converted; the other is a typed BSON date.',
    context:'The sample publication timestamp illustrates a type and does not assert a historical time of day. ISODate and ObjectId are mongosh constructors/display conventions, not JSON syntax. BSON ObjectId is 12 bytes and is commonly shown as 24 hexadecimal characters. '+MONGO+'reference/bson-types/ ; '+MONGO+'reference/method/objectid/'
  },'27',{minutes:3});

  scene('Database and collection',['Connect to an endpoint','Choose a database','Choose a collection','Read a document'],(d,s)=>{
    title(d,'Database and collection');
    ['Endpoint','ds2022_lecture06','books','book_001'].forEach((v,i)=>{box(d,'level-'+i,70+i*300,245,240,110,v,i===s,P.green,i===1?25:31);if(i<3)d.arrow('level-edge-'+i,322+i*300,300,355+i*300,300,P.green,3);text(d,'kind-'+i,190+i*300,430,['Connection','Database','Collection','Document'][i],27,P.muted);});
  },{
    idea:'A MongoDB connection reaches databases, which contain collections of documents.',
    builds:['Point to Endpoint and explain that the client first needs the correct server or cluster address and authorization. An endpoint is not itself a collection.','Point to ds2022_lecture06 as the course database name. Compare it with choosing a database in the SQL lecture.','Point to books as a collection within ds2022_lecture06. Compare its role with a table while remembering that document fields can be nested and validated differently.','Point to book_001 as one document identifier. A query may return this document, several documents, or none.'],
    question:'Where does the books collection belong in this hierarchy?',
    answer:'It belongs inside the ds2022_lecture06 database, which the client reaches through a connection endpoint.',
    context:'A connection URI may contain several hosts, options, and authentication details. The diagram is a logical hierarchy rather than a literal server filesystem. '+MONGO+'core/databases-and-collections/'
  },'28',{minutes:2});

  scene('Choose an identifier',['A supplied identifier','A common generated default','Identity remains stable'],(d,s)=>{
    title(d,'Choose an identifier');
    const lines=s===1?['{','  _id: ObjectId("507f1f77bcf86cd799439011"),','  name: "Jane Austen"','}']:['{','  "_id": "author_001",','  "name": "Jane Austen"','}'];
    code(d,'document',lines,90,220,33,61,1);
    text(d,'rule',640,515,['You may supply an identifier','ObjectId is a common default','Unique within the collection'][s],32,P.green);
  },{
    idea:'The _id field identifies a document, and an ObjectId is a common default rather than the only allowed identifier.',
    builds:['Point to the supplied string author_001. Explain that the application can choose an appropriate supported identifier value.','Point to the ObjectId example. When an identifier is omitted, MongoDB drivers commonly generate an ObjectId; its type is different from the string in the first build.','Return to author_001 and the uniqueness rule. Explain that a document’s _id is stable and cannot be changed through an ordinary update.'],
    question:'Must every MongoDB document use a twenty-four-character string for _id?',
    answer:'No. The example uses a supplied string, and ObjectId is a separate BSON type commonly used as a default.',
    context:'For standard collections, _id is required, unique within the collection, and immutable. Time-series and sharded collection details need additional qualification; the course examples use ordinary collections. '+MONGO+'core/document/ ; '+MONGO+'reference/method/objectid/'
  },'30',{minutes:3});

  scene('A bookstore model',['Authors','Books','Reviews'],(d,s)=>{
    title(d,'A bookstore model');
    box(d,'author',85,220,355,220,'',s===0,P.green);text(d,'author-kind',263,265,'authors',29,P.muted);text(d,'author-name',263,330,'Jane Austen',34);text(d,'author-id',263,395,'author_001',27,P.green);
    box(d,'book',485,220,390,220,'',s===1,P.green);text(d,'book-kind',680,265,'books',29,P.muted);text(d,'book-title',680,330,'Pride and Prejudice',31);text(d,'book-id',680,395,'book_001',27,P.green);
    if(s===2){box(d,'review',925,220,270,220,'',true,P.orange);text(d,'review-kind',1060,265,'reviews',29,P.muted);text(d,'review-user',1060,330,'Alice · 5 stars',29);text(d,'review-id',1060,395,'review_001',27,P.green);}
    if(s>=1)d.arrow('author-book',452,335,473,335,P.green,3);if(s===2)d.arrow('book-review',887,335,913,335,P.green,3);
  },{
    idea:'A document model still needs clear entities and relationships, even when their storage differs from SQL tables.',
    builds:['Point to the authors collection and Jane Austen’s identifier. Explain that the identifier lets other documents refer to the author without relying on a name match.','Point to Pride and Prejudice and its different identifier. The book is a separate entity that can refer to its author.','Point to Alice’s review as a third entity. The review belongs to a book and has its own identity and fields.'],
    question:'Why should a review refer to book_001 rather than only to the book title?',
    answer:'A stable identifier distinguishes the intended book even if titles repeat or displayed text changes.',
    context:'The bookstore seed uses Jane Austen, Pride and Prejudice, and Emma. Alice’s review is synthetic. The diagram introduces entities; subsequent builds decide which relationships are embedded or referenced.'
  },'29–30',{activity:'modeling',minutes:2});

  scene('Relationship cardinality',['Author and biography','Authors and books','Books and reviews'],(d,s)=>{
    title(d,'Relationship cardinality');
    const left=['Author','Author','Book'][s],right=['Biography','Book','Review'][s];
    box(d,'left',125,255,345,115,left,true,P.green,38);box(d,'right',810,255,345,115,right,true,P.blue,38);d.line('relationship',485,312,795,312,P.green,4);
    text(d,'left-count',525,275,s===1?'many':'1',30,P.orange);text(d,'right-count',755,275,s===0?'1':'many',30,P.orange);
    text(d,'pattern',640,470,['One-to-one','Many-to-many','One-to-many'][s],36,P.green);
  },{
    idea:'Cardinality describes how many related entities can appear on each side of a relationship.',
    builds:['Read Author to Biography as one-to-one in this simplified model. The course chooses one biography record per author; that is a modeling rule, not a universal fact about biographies.','Read Author to Book as many-to-many. One author can write many books, and the general model also permits a coauthored book.','Read Book to Review as one-to-many. One book can accumulate many review documents, while each review in this model refers to one book.'],
    question:'Why might author_ids be an array in a book document?',
    answer:'The model permits more than one author for a book, so the array can hold several author identifiers.',
    context:'The seed books each have one author, but the structure supports coauthorship. Cardinality alone does not dictate embedding; size, growth, sharing, and access patterns also matter.'
  },'30',{activity:'modeling',minutes:3});

  scene('Reference a biography',['Author reference','Separate biography','Follow the identifier'],(d,s)=>{
    title(d,'Reference a biography');
    code(d,'author',['{','  "_id": "author_001",','  "bio_id": "bio_001"','}'],90,220,28,54,s===2?2:-1,505);
    if(s>=1)code(d,'bio',['{','  "_id": "bio_001",','  "short": "English novelist"','}'],720,220,28,54,s===2?1:-1,490);
    if(s===2)d.arrow('reference',585,328,695,274,P.green,4);
    text(d,'collections',640,500,'authors → bios',32,P.green);
  },{
    idea:'A reference stores an identifier that connects one document to another document.',
    builds:['Read the author document and point to bio_id. Its value names another document; it does not contain the biography itself.','Point to the separate biography document and match its _id to bio_id. Explain that the biography can be stored and updated independently.','Follow the arrow between the matching values. The application or a database query must resolve that relationship when it needs both pieces of information.'],
    question:'What must match for this reference to reach the displayed biography?',
    answer:'The author’s bio_id value must equal the biography document’s _id value.',
    context:'This is an alternative design used for comparison; the downloadable seed embeds a short bio. MongoDB does not automatically enforce a SQL-style foreign key for this application-level reference. '+MONGO+'data-modeling/concepts/embedding-vs-references/'
  },'31–32',{activity:'modeling',minutes:3});

  scene('Embed a biography',['The author','The nested biography','Read together'],(d,s)=>{
    title(d,'Embed a biography');
    code(d,'embedded',['{','  "_id": "author_001",','  "name": "Jane Austen",','  "bio": {','    "short": "English novelist"','  }','}'],130,180,31,46,s===0?2:s===1?4:-1,990);
    if(s===2){d.rect('one-document',100,150,1050,355,'none',P.green,9,3);text(d,'read',1000,450,'One document',29,P.green);}
  },{
    idea:'Embedding places related information inside a document so it can be retrieved with that document.',
    builds:['Point to the author’s identifier and name. We are keeping the same author entity while changing how the biography is represented.','Point to bio and the short field nested inside it. The biography value is now part of the author document rather than reached through bio_id.','Trace the outline around the whole document. A read of this document can include both the author and the embedded short biography.'],
    question:'Which lookup from the reference design is no longer required to read this short biography?',
    answer:'The separate lookup of a biography document by bio_id is no longer required.',
    context:'Embedding can suit small, bounded data read together. It does not mean every relationship should be embedded, and standard BSON documents have a 16 MiB size limit. '+MONGO+'core/document/ ; '+MONGO+'data-modeling/concepts/embedding-vs-references/'
  },'31, 33',{activity:'modeling',minutes:3});

  scene('Choose embed or reference',['Small and read together','Shared or growing','Ask about the workload'],(d,s)=>{
    title(d,'Choose embed or reference');
    const rows=s===0?[['Short biography','Embed candidate'],['Read with author','One document']]:s===1?[['Book reviews','Reference candidate'],['Growing independently','Separate documents']]:[['Read pattern','Together or separate?'],['Growth','Bounded or unbounded?'],['Updates','Shared or independent?']];
    table(d,'choices',110,210,[580,480],[['Consider','Consequence'],...rows],{rowHeight:72,fontSize:30});
  },{
    idea:'Embedding and referencing trade read convenience against growth, sharing, and update responsibilities.',
    builds:['Point to the short biography and its read pattern. Explain why a small field usually read with one author is a reasonable embedding candidate.','Point to reviews and their independent growth. A separate collection can avoid an ever-growing book document and support review-specific queries and updates.','Read each design question. Ask students to justify a choice with an access pattern and a size or update constraint rather than a blanket rule.'],
    question:'Why might embedding every review inside a popular book become a problem?',
    answer:'The array can grow without a useful bound, increase document size, and complicate independent review access and updates.',
    context:'Many-to-many or frequently shared entities often favor references; small bounded one-to-many data can favor embedding. These are design considerations, not laws. MongoDB also supports aggregation joins when suitable. '+MONGO+'data-modeling/ ; '+MONGO+'data-modeling/concepts/embedding-vs-references/'
  },'34',{activity:'modeling',minutes:3});

  exercise('modeling','Embed or reference',6,['Update one embedded author copy.','Compare shared-author updates.'],'Which copies must change?','34',{
    idea:'A modeling choice changes both the work required to read data and the work required to update it.',
    builds:['Open Embed or reference with the green ↗ link and allow six minutes. Reset to Embedded copy, edit the biography, select Update book_001’s author copy, and compare the two books; then select Update both author copies. Switch to One shared author, which resets the data, and select Update the shared author; return ready to identify which stored copies must change.'],
    question:'What update risk appears when a shared fact is copied into several documents?',
    answer:'Every copy must be kept consistent; changing only one can leave the documents disagreeing.',
    context:'The simulation makes a small storage choice visible. A production decision also needs expected reads, write frequency, document growth, validation, and failure handling.'
  });

  scene('Create a document',['Choose the database','Insert one document','Observe the stored record'],(d,s)=>{
    title(d,'Create a document');
    code(d,'insert',['use ds2022_lecture06','db.books.insertOne({','  _id: "book_003",','  title: "Sample Book",','  published_year: 2026','})'],85,190,29,53,s===0?0:s===1?2:-1,600);
    if(s===2){table(d,'stored',750,250,[210,220],[['_id','published_year'],['book_003','2026']],{rowHeight:75,fontSize:25,highlightRows:[1]});text(d,'collection',965,200,'books',30,P.green);}
  },{
    idea:'An insert creates a document in a collection, while use only selects the database context in mongosh.',
    builds:['Read use ds2022_lecture06 and explain that it selects the course database used by the companion setup. Selection alone does not persist a new database or insert any records.','Read insertOne and the supplied _id. Explain that this fictional sample book is a new document, and the chosen identifier must not conflict with an existing document.','Point to the stored record on the right. Explain that an insert can also create a missing ordinary collection and its database, provided permissions and rules allow it.'],
    question:'Which line actually writes the new record?',
    answer:'The insertOne call writes it; use ds2022_lecture06 only selects the database context.',
    context:'This is mongosh syntax for the companion’s seeded ds2022_lecture06 database. Assume book_003 is absent; rerunning the insert produces a duplicate-key error rather than overwriting it. Sample Book is fictional. The independent browser simulator has its own starting documents and example operations. '+MONGO+'core/databases-and-collections/ ; '+MONGO+'crud/'
  },'28, 35',{activity:'documents',minutes:3});

  scene('Find matching documents',['Stored documents','Apply the condition','Return matches'],(d,s)=>{
    title(d,'Find matching documents');code(d,'query',['db.books.find({published_year: {$lt: 1820}})'],115,180,32,48,s===1?0:-1,1040);
    const rows=[['book_001','Pride and Prejudice','1813'],['book_002','Emma','1815'],['book_003','Sample Book','2026']];
    table(d,'books',115,265,[230,500,320],[['_id','title','published_year'],...(s===2?rows.slice(0,2):rows)],{rowHeight:65,fontSize:31,highlightRows:s===1?[1,2]:[]});
  },{
    idea:'A query filter selects documents whose field values meet the requested condition.',
    builds:['Read the three stored books and their publication years. Ask students which records should satisfy the filter before showing any highlighted matches.','Point to $lt and read it as less than. Follow the highlighted rows whose published_year is less than 1820.','Point to the two returned documents. The excluded sample book still exists in storage; a read filter has not deleted it.'],
    question:'Would a book with published_year 1820 match this filter?',
    answer:'No. $lt means strictly less than 1820; $lte would include equality.',
    context:'The table is a teaching view of document fields, not a claim that MongoDB stores these documents as a relational table. find returns a cursor in mongosh and drivers; ordering is not guaranteed without a sort. '+MONGO+'crud/'
  },'35',{activity:'documents',minutes:3});

  scene('Update a matching document',['Identify the target','Change one field','Observe the new value'],(d,s)=>{
    title(d,'Update a matching document');code(d,'update',['db.books.updateOne(','  {_id: "book_003"},','  {$set: {published_year: 2027}}',')'],85,225,30,65,s===0?1:s===1?2:-1,625);
    table(d,'record',755,230,[265,165],[['Field','Value'],['_id','book_003'],['published_year',s===2?'2027':'2026']],{rowHeight:72,fontSize:28,highlightRows:s===2?[2]:[]});
  },{
    idea:'An update combines a filter that finds a document with an operation that changes selected fields.',
    builds:['Point to the _id filter and match it to book_003 in the displayed record. Explain that the filter identifies which document the operation should consider.','Point to $set and the new year. Only the named field changes; fields such as title remain present.','Point to 2027 in the stored record. The document retains its identifier while its year changes.'],
    question:'Does this $set replace the entire book document?',
    answer:'No. It sets published_year while retaining other fields in the matching document.',
    context:'updateOne updates at most one matched document. With no match it makes no change unless an explicit upsert option is used. Inspect matched_count and modified_count in driver results when verifying behavior. '+MONGO+'crud/'
  },'35',{activity:'documents',minutes:3});

  scene('Delete a document',['Choose one identifier','Remove its document'],(d,s)=>{
    title(d,'Delete a document');code(d,'delete',['db.books.deleteOne({_id: "book_003"})'],95,185,31,45,s?0:-1,1090);
    const rows=[['book_001','Pride and Prejudice'],['book_002','Emma'],['book_003','Sample Book']];
    table(d,'remaining',200,285,[280,600],[['_id','title'],...(s?rows.slice(0,2):rows)],{rowHeight:62,fontSize:31,highlightRows:s?[]:[3]});
  },{
    idea:'Deleting one document removes that record while leaving the collection and unrelated documents in place.',
    builds:['Read the exact identifier in deleteOne and point to the selected sample-book row. Ask students to name the records that should remain.','Point to the two remaining books. The collection still exists, and neither other book was selected by this filter.'],
    question:'Does deleteOne automatically delete review documents that refer to this book?',
    answer:'No. The application must decide how to handle related documents; an application-level reference does not automatically cascade a delete.',
    context:'The sample book has no reviews in this teaching sequence. A destructive operation should always use an intentional filter in the approved sandbox. The displayed code is inert. '+MONGO+'crud/'
  },'35',{activity:'documents',minutes:2});

  exercise('documents','Document operations',7,['Predict each filter’s matches.','Create, read, update, and delete.'],'Which fields actually changed?','35',{
    idea:'Inspect the matched documents and the resulting state to distinguish each CRUD operation.',
    builds:['Open Document operations with the green ↗ link and allow seven minutes. Reset, choose examples from the Load an example menu, predict their matches or effects, and select the corresponding Run button; choose Find · all documents and run it to inspect the stored state afterward. For the update example, return ready to name the book selected and the price field changed by $set.'],
    question:'What evidence distinguishes a read from an update?',
    answer:'A read returns matching values without changing stored documents; an update changes the selected stored fields, which a later read can reveal.',
    context:'The browser activity simulates a small subset of MongoDB behavior. It is independent of Atlas and does not run arbitrary MongoDB commands.'
  });

  scene('MongoDB tools',['Managed service','Interactive clients','Python programs'],(d,s)=>{
    title(d,'MongoDB tools');
    const labels=['Atlas','mongosh / Compass','PyMongo'],details=['Managed deployment','Shell / graphical client','Python driver'];
    labels.forEach((v,i)=>{box(d,'tool-'+i,90+i*395,220,310,105,v,i===s,P.green,i===1?28:36);text(d,'detail-'+i,245+i*395,400,details[i],27,P.muted);});
  },{
    idea:'A database service, an interactive client, and a programming driver serve different roles.',
    builds:['Point to Atlas and describe it as a managed deployment service. Its tier and configuration determine which capacity, backup, security, and scaling features are available.','Point to mongosh and Compass. Explain that the shell and graphical client let people connect to and inspect a deployment.','Point to PyMongo and explain that a Python application uses this driver to send operations and read results. The driver is not itself the database server.'],
    question:'Which component does a Python ETL script use to talk to MongoDB?',
    answer:'It uses a driver such as PyMongo, together with a connection URI and appropriate permissions.',
    context:'Do not promise managed backups or every paid-tier feature on Atlas Free. Never put real passwords into projected code, repository files, or screenshots. '+MONGO+'mongo/ ; https://www.mongodb.com/docs/compass/current/ ; https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/'
  },'35',{minutes:2});

  scene('Python connection flow',['Read configuration','Open the client','Select a collection'],(d,s)=>{
    title(d,'Python connection flow');code(d,'python',['import os','from pymongo import MongoClient','','uri = os.environ["MONGODB_URI"]','with MongoClient(uri) as client:','    books = client["ds2022_lecture06"]["books"]'],85,180,30,53,[3,4,5][s]);
  },{
    idea:'A Python client separates private connection configuration from the collection operations in the program.',
    builds:['Point to the MONGODB_URI lookup. Explain that the environment variable supplies the URI without embedding a password in the source file.','Point to the with statement and the MongoClient. The context manager closes the client when the block ends, including when an exception leaves the block.','Follow the two name lookups from client to ds2022_lecture06 to books. This selects a collection handle; it does not yet insert or retrieve a document.'],
    question:'Has selecting books already proved that the server is reachable and a query will succeed?',
    answer:'No. Creating a client or collection handle is not sufficient proof; perform an operation and handle connection, authentication, and other failures.',
    context:'This is a synchronous PyMongo skeleton. Configure the approved URI and permissions outside source control; real applications also need suitable timeout and exception handling. The client context manager is resource cleanup, not a transaction boundary. https://www.mongodb.com/docs/languages/python/pymongo-driver/current/connect/mongoclient/'
  },'35, 43',{minutes:3});

  scene('Python document operations',['Insert a dictionary','Read matching documents','Update and inspect'],(d,s)=>{
    title(d,'Python document operations');d.text('inside',80,150,'Inside the client context',26,P.muted,'start');
    const builds=[['books.insert_one({','    "_id": "book_003",','    "title": "Sample Book",','    "published_year": 2026','})'],['query = {"published_year": {"$lt": 1820}}','for book in books.find(query):','    print(book["title"])'],['result = books.update_one(','    {"_id": "book_003"},','    {"$set": {"published_year": 2027}}',')','print(result.matched_count, result.modified_count)']];
    code(d,'operation',builds[s],85,235,29,56,s===0?1:s===1?0:4);
  },{
    idea:'PyMongo sends structured Python values to database operations and returns documents or result objects.',
    builds:['Read the Python dictionary passed to insert_one. Connect the snake_case method name to mongosh’s insertOne and note that the dictionary is data, not a constructed query string.','Read the query dictionary and the loop that passes it to find. Each returned document is represented as a Python mapping from which the title can be read.','Point to the filter, update document, and result counts. Ask students to use the counts and a follow-up read to verify whether the expected document changed.'],
    question:'What does matched_count tell us that merely calling update_one does not?',
    answer:'It tells us how many documents matched the filter; an update request can succeed without finding any document.',
    context:'The three builds illustrate separate operations inside the previous client context, with book_003 initially absent for the insert. Production code must handle exceptions and input validation. Do not accept arbitrary client-supplied query operators as trusted filters. https://www.mongodb.com/docs/languages/python/pymongo-driver/current/crud/'
  },'35, 43',{activity:'documents',minutes:3});

  scene('ACID is a set of guarantees',['Atomicity','Consistency','Isolation','Durability'],(d,s)=>{
    title(d,'ACID is a set of guarantees');
    const labels=['Atomicity','Consistency','Isolation','Durability'],meaning=['All or nothing','Preserve declared invariants','Control concurrent effects','Retain committed results'];
    labels.forEach((v,i)=>box(d,'acid-'+i,85+i*300,195,240,88,v,i===s,P.green,30));
    text(d,'meaning',640,390,meaning[s],40,P.green);text(d,'scope',640,510,'Check the transaction boundary and configuration',29,P.muted);
  },{
    idea:'ACID describes transaction guarantees, and its meaning depends on the system’s rules and configuration.',
    builds:['Point to Atomicity and read all or nothing. A transaction should not leave only part of its intended changes committed.','Point to Consistency and read declared invariants. Explain that constraints and application logic define the valid states; this term is not the same as every replica always showing the latest value.','Point to Isolation and explain that the configured isolation behavior controls what concurrent operations can observe. Different isolation levels make different promises.','Point to Durability and explain that a committed result survives the failures covered by the system’s durability configuration. Ask what acknowledgment and failure assumptions are in force.'],
    question:'Does ACID consistency mean that every replica must always show the newest write?',
    answer:'No. ACID consistency concerns valid state transitions and invariants; replica visibility depends on separate read, write, and replication guarantees.',
    context:'ACID is not exclusive to SQL systems. MongoDB provides atomic single-document writes and supports multi-document transactions with deployment and usage requirements. Guarantees have costs and scope. '+MONGO+'core/transactions/ ; https://www.allthingsdistributed.com/2008/12/eventually_consistent.html'
  },'36–37',{minutes:4});

  scene('Choose the atomic boundary',['One document','Two separate writes','A transaction'],(d,s)=>{
    title(d,'Choose the atomic boundary');
    box(d,'inventory',110,220,460,140,'Inventory: 1 → 0',s!==1,P.green,34);box(d,'order',710,220,460,140,'Order: add one',s===2,P.green,34);
    if(s===0){d.rect('one-boundary',85,190,510,195,'none',P.green,12,4);text(d,'scope',640,490,'Single-document atomic update',35,P.green);}
    else if(s===1){d.arrow('next-write',590,290,690,290,P.orange,4);text(d,'risk',640,430,'Failure between writes?',36,P.orange);}
    else{d.rect('transaction',75,180,1120,225,'none',P.green,12,4);text(d,'scope',640,490,'Commit both changes together',35,P.green);}
  },{
    idea:'Atomicity applies to a defined operation or transaction boundary, not automatically to every step in a program.',
    builds:['Point to the outline around inventory. Explain that an update to one MongoDB document is atomic even when several fields in that document change.','Point between the two separate writes. Ask what happens if inventory changes but the program fails before it adds the order; without a shared transaction, the first successful write can remain.','Trace the larger boundary around both changes. Explain that a supported transaction can commit the group together or abort it, while still requiring correct application logic and concurrency handling.'],
    question:'Does placing two writes consecutively in Python make them one atomic transaction?',
    answer:'No. The application must use the supported transaction mechanism if those writes need a shared atomic boundary.',
    context:'This is a conceptual transaction, not executable reservation logic. A real reservation also needs a conditional stock check and suitable retry/error handling. MongoDB multi-document transactions require a supported replica-set or sharded deployment, not a standalone server. '+MONGO+'core/write-operations-atomicity/ ; '+MONGO+'core/transactions/'
  },'37',{minutes:3});

  scene('BASE and convergence',['Basically available','Soft state','Eventually consistent'],(d,s)=>{
    title(d,'BASE and convergence');
    const labels=['Basically available','Soft state','Eventually consistent'],details=['Availability under chosen failures','Background state changes','Replicas converge under stated conditions'];
    text(d,'term',640,235,labels[s],45,P.green);text(d,'description',640,350,details[s],34);
    text(d,'warning',640,510,'A design vocabulary, not a SQL / NoSQL switch',30,P.muted);
  },{
    idea:'BASE describes designs that emphasize availability and allow state to converge under specified conditions.',
    builds:['Read Basically available and emphasize that the exact availability guarantee still depends on the system and its failure assumptions. The acronym is not a promise that every request always succeeds.','Read Soft state and explain that background propagation or expiration can change a node’s state without a new request from the client observing it.','Read Eventually consistent and state the conditions: if writes stop and updates can propagate and be resolved, replicas eventually converge. The term does not promise a fixed delay.'],
    question:'What conditions are missing from the claim “these replicas will eventually agree”?',
    answer:'We need assumptions such as no continuing writes, successful update propagation, and a defined way to resolve conflicts.',
    context:'BASE and ACID are not a clean product taxonomy or exclusive SQL-versus-NoSQL categories. A system may offer transactions while some replica reads can lag; stronger reads may also be available. https://www.allthingsdistributed.com/2008/12/eventually_consistent.html ; '+MONGO+'core/replica-set-sync/'
  },'38',{minutes:3});

  scene('A lagging replica',['Both copies agree','A write reaches one copy','A stale read','Propagation catches up'],(d,s)=>{
    title(d,'A lagging replica');
    const us=s===0?'$20':'$22',eu=s===3?'$22':'$20';
    box(d,'primary',120,230,395,160,'',true,P.green);box(d,'secondary',765,230,395,160,'',true,s===1||s===2?P.orange:P.green);
    text(d,'primary-name',317,270,'Primary',31);text(d,'primary-value',317,340,us,45,P.green);text(d,'secondary-name',962,270,'Secondary',31);text(d,'secondary-value',962,340,eu,45,s===1||s===2?P.orange:P.green);
    if(s===1||s===2){d.line('pending',540,310,735,310,P.orange,4,'12 10');text(d,'lag',640,265,'Lag',29,P.orange);}
    if(s===3)d.arrow('delivered',540,310,735,310,P.green,4);
    text(d,'observation',640,490,['Same value','Update pending','Secondary read: $20','Copies agree again'][s],34,P.green);
  },{
    idea:'Asynchronous replication can leave a readable copy temporarily behind a more recently written copy.',
    builds:['Point to the matching prices in both copies. These prices are illustrative values for one record, not a statement about geographic deployment guarantees.','Point to the primary’s new value and the secondary’s unchanged value. The dashed line represents an update that has not yet been applied there.','Read the secondary result of twenty dollars. Explain why a permitted secondary read can return an older value even though another client has already written twenty-two dollars.','Follow the completed arrow and compare the two prices. With no newer writes and successful propagation, this example converges.'],
    question:'Is the secondary’s twenty-dollar response proof that the write never happened?',
    answer:'No. The write may have happened on the primary while the secondary is still behind.',
    context:'MongoDB secondaries replicate and apply the oplog asynchronously. Read preference, read concern, write concern, and sessions affect available guarantees; this animation does not model all combinations or promise a maximum lag. '+MONGO+'core/replica-set-sync/'
  },'38',{activity:'replication',minutes:4});

  exercise('replication','Observe replication lag',6,['Partition A–B; write twice at A.','Deliver, read B, restore, deliver again.'],'What changed without another write?','38',{
    idea:'Separate a write from replication delivery to see why two permitted reads can disagree.',
    builds:['Open Observe replication lag with the green ↗ link and allow six minutes. Reset, partition A–B, and write two different store-hours values at primary A; select Deliver all available messages, then select B and Read. Restore A–B, deliver again, and read B again; return ready to explain what changed without another application write.'],
    question:'Why can the secondary change after delivery even when the client makes no new write?',
    answer:'It applies an earlier queued update, so background replication changes the copy’s state.',
    context:'The browser simulation makes delivery explicit for learning. Real systems have background replication, failure modes, and configurable acknowledgment and read guarantees.'
  });

  scene('WORM retention',['Write once','Protect during retention','Separate verification'],(d,s)=>{
    title(d,'WORM retention');
    flow(d,s===2?['Retained record','Verification']:['Write record','Retain record'],s?1:0,245);
    text(d,'rule',640,430,['Write once, read many','Modification / deletion restricted','Hashes or signatures need extra mechanisms'][s],34,s===1?P.orange:P.green);
    text(d,'scope',640,515,'Check the policy, duration, and permissions',29,P.muted);
  },{
    idea:'WORM retention restricts changes to stored records under a configured policy, while tamper verification is a separate capability.',
    builds:['Read write once, read many and follow the record into retention. Explain that retaining a version does not mean all other records in the system stop changing.','Point to the modification and deletion restriction. Ask which retention period, legal hold, and privilege rules apply before claiming that a record cannot be removed.','Point to Verification and separate preservation from proof. Cryptographic hashes, signatures, or verifiable ledger features are additional mechanisms, not automatic consequences of append-only storage.'],
    question:'Does an append-only file automatically provide cryptographic proof that nobody altered its history?',
    answer:'No. Append-only behavior and cryptographic tamper evidence are different properties and require different controls.',
    context:'WORM means write once, read many; deletion rules depend on the configured mechanism and policy. Amazon S3 Object Lock illustrates version retention and legal holds. The source’s QLDB example is historical: AWS ended QLDB support on July 31, 2025. https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html ; https://docs.aws.amazon.com/qldb/latest/developerguide/getting-started-step-7.html'
  },'39',{minutes:3});

  scene('Choose guarantees deliberately',['Model','Operations','Failure behavior'],(d,s)=>{
    title(d,'Choose guarantees deliberately');
    const prompts=[['Model','What belongs together?'],['Operations','What must change together?'],['Failures','What may a reader observe?']];
    prompts.forEach(([label,value],i)=>{box(d,'label-'+i,100,195+i*105,260,75,label,i===s,P.green,31);d.text('prompt-'+i,420,233+i*105,value,34,i===s?P.green:P.ink,'start');});
  },{
    idea:'Choose a database by the application’s data, operations, and required guarantees rather than by a SQL or NoSQL label alone.',
    builds:['Point to Model and recall the document, partition, and graph examples. Ask what information is read together and which relationships matter.','Point to Operations and connect the prompt to the inventory-and-order example. Identify which changes need a common atomic boundary.','Point to Failures and connect the prompt to the lagging secondary. Ask whether an older read is acceptable and what the application should do when a guarantee cannot be met.'],
    question:'Which requirement would you state before choosing a replication read policy?',
    answer:'State what freshness and consistency the application needs and what latency or unavailability it can tolerate when that guarantee cannot be provided.',
    context:'The source’s SQL/NoSQL and ACID/BASE comparison is best used as a list of questions. Modern systems expose overlapping models, transaction support, and tunable replication behavior.'
  },'36–39',{kind:'recap',minutes:2});

  scene('Prepare for the hands-on',['Atlas preparation','Course resources','Check the assignment'],(d,s)=>{
    title(d,'Prepare for the hands-on');
    text(d,'prepare',640,220,'Atlas setup · about 10 minutes',39,P.green);text(d,'due',640,310,'Source deadline: September 30',34,P.orange);
    if(s===1)text(d,'resources',640,440,'Canvas · Module 02 · Week 06',33);
    if(s===2){text(d,'assignment',640,430,'SQL assignment: check Canvas',34);text(d,'number',640,505,'Source lab numbering conflicts',29,P.muted);}
  },{
    idea:'Complete the approved connection setup before class and use Canvas to resolve assignment details.',
    builds:['Read the Atlas setup estimate and September 30 source deadline. Ask students to follow the course setup steps so they can connect during the next meeting.','Point to the Week 06 resources. Direct students to the MongoDB introduction and cheat sheet listed by the current course materials.','Point to the assignment reminder and explain the numbering conflict plainly. Students should use the current Canvas assignment title and due date rather than infer the lab number from this slide.'],
    question:'Where should you resolve a disagreement between the lecture’s lab label and the current assignment?',
    answer:'Use Canvas and the instructor’s current assignment instructions.',
    context:'Source slide 40 labels a SQL assignment “Lab 05” due September 30, while source slide 44 labels NoSQL “Lab 05” due October 7; the prior SQL lecture called its work Lab 04. Preserve the source deadlines as course information and defer the authoritative labels and updates to Canvas. Atlas Free features vary by tier and configuration.'
  },'40',{kind:'recap',minutes:2});

  scene('NoSQL practice',['The second meeting','The sequence'],(d,s)=>{
    d.text('course',80,135,'DS 2022 · October 1, 2026',30,P.green,'start',650);d.text('practice',80,245,'NoSQL practice',70,P.ink,'start',650);
    if(s){flow(d,['mongosh','PyMongo','Lab practice'],1,395);}else text(d,'question',640,430,'Questions before connecting?',36,P.green);
  },{
    idea:'The second meeting applies document modeling and operations through a shell, a Python driver, and the lab.',
    builds:['Read the October 1 date and pause for questions from the preparation work. Ask students to identify whether any issue concerns data modeling, credentials, network access, or a client tool.','Follow mongosh to PyMongo to lab practice. Explain that students will use the same underlying document ideas through two client interfaces before continuing the assignment.'],
    question:'What stays the same when we switch from mongosh to PyMongo?',
    answer:'The database, collections, documents, filters, and intended operation stay the same; the client language and API syntax change.',
    context:'This marks the source deck’s October 1 session. Use the approved course database and current setup instructions; a client tool alone does not create permissions or network access.'
  },'41–43',{kind:'title',minutes:2});

  scene('Hands-on workflow',['Prepare the repository','Try the shell','Repeat in Python'],(d,s)=>{
    title(d,'Hands-on workflow');
    const labels=['Review and sync work','Run mongosh examples','Run PyMongo examples'];labels.forEach((v,i)=>box(d,'task-'+i,190,180+i*110,900,80,v,i===s,P.green,35));
    text(d,'path',640,545,'class/05-nosql',29,P.muted);
  },{
    idea:'Use the course workflow to prepare the repository, test document operations interactively, and repeat them in Python.',
    builds:['Point to Review and sync work. Have students inspect their changes, save the work they intend to keep, and follow the course README for updating their fork and local clone.','Point to Run mongosh examples and the class/05-nosql path. Ask students to predict one filter’s matches, run it in the course sandbox, and inspect the result.','Point to Run PyMongo examples. Have students express the same filter in Python and compare the results before changing any data.'],
    question:'What should agree between the shell and Python versions of the same read?',
    answer:'Given the same data, filter, projection, and relevant read settings, they should select the same documents; display formatting may differ.',
    context:'Allow about twelve minutes, then continue Lab 05 if time remains. Repository synchronization and database setup are student instructions, not automatic actions performed by the slide deck. Current source exercise: https://github.com/ksiller/DS2022/blob/main/class/05-nosql/README.md . The separate hierarchical-data exercise lives at class/05-data.'
  },'43',{kind:'activity',activity:'documents',minutes:12});

  scene('NoSQL assignment',['The lab','An exit question'],(d,s)=>{
    title(d,'NoSQL assignment');text(d,'lab',640,225,'Lab 05 · NoSQL',43,P.green);text(d,'deadline',640,330,'Source deadline: October 7',36,P.orange);
    if(s)text(d,'exit',640,480,'What would you embed, and why?',36);
  },{
    idea:'Use the lab to justify a document model and verify its operations with observable results.',
    builds:['Read the source’s NoSQL lab label and October 7 deadline. Ask students to open the current Canvas assignment and check its exact requirements.','Read the exit question and ask each group for one embedding or referencing decision. Require an access pattern, a growth assumption, or an update responsibility in the explanation.'],
    question:'What makes “embed because it is NoSQL” an incomplete design explanation?',
    answer:'It does not address the queries, document growth, shared data, or updates that determine whether embedding fits this application.',
    context:'The source lists Lab 05: NoSQL due October 7, with Module 02 Week 06 resources. Canvas remains authoritative, especially because the earlier source slide reuses Lab 05 for SQL work.'
  },'44',{kind:'recap',minutes:2});

  scene('Exam reminder',['The date and format','Connect the examples'],(d,s)=>{
    title(d,'Exam reminder');text(d,'exam',640,215,'October 8 · 50 minutes',43,P.green);text(d,'scope',640,305,'Modules 1–2 · Weeks 1–6',35);
    if(s===0)text(d,'format',640,445,'Paper · no notes, phones, or online resources',31,P.orange);
    else text(d,'examples',640,445,'Predict → trace → explain',42,P.green);
  },{
    idea:'Use small examples to connect commands, data representations, database models, and observable behavior.',
    builds:['Read the exam reminder and confirm that students know the in-class, multiple-choice, pencil-and-paper format. Refer any changed arrangements to Canvas and the instructor.','Read predict, trace, explain. Ask students to choose an example from redirection, repository copies, JSON paths, document updates, or replication and explain its result without running it.'],
    question:'If a replica returns an older value, which part of the system would you investigate first?',
    answer:'Investigate the read target and read guarantees, whether replication is delayed, and whether the write was acknowledged under the expected policy.',
    context:'The source repeats October 8, fifty minutes, Modules 1–2 and Weeks 1–6, with no notes or online resources. The current course instructions and approved accommodations govern the actual exam.'
  },'45',{kind:'recap',minutes:2});

  window.COURSE_DECKS=window.COURSE_DECKS||{};
  window.COURSE_DECKS[6]={id:6,title:'NoSQL',date:'September 29 & October 1, 2026',source:'lectures/lecture-06/index.html',scenes};
})();
