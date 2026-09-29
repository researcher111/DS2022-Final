/* Lecture 06: NoSQL. A bookstore story ending with checkout transactions; companion retains extension material.
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
  function exercise(activity,name,minutes,tasks,question,sourceSlides,teaching,id) {
    scene('Exercise: '+name,['Switch to the interactive exercise'],d=>{
      title(d,'Switch to the interactive');
      d.text('exercise-name',80,200,name+' · '+minutes+' minutes',40,P.green,'start',600);
      tasks.forEach((task,i)=>d.text('exercise-task-'+i,80,300+i*52,task,31,P.ink,'start'));
      d.text('exercise-discussion',80,455,'Return ready to explain:',28,P.muted,'start');
      d.text('exercise-question',80,505,question,33,P.green,'start');
      d.text('exercise-link-hint',80,145,'Open this exercise with ↗ below',27,P.muted,'start');
    },teaching,sourceSlides,{kind:'activity',activity,activityBreak:true,minutes,...(id?{id}:{})});
  }

  const BOOKS=[
    ['book_001','Pride and Prejudice','Jane Austen','18'],
    ['book_002','Emma','Jane Austen','24'],
    ['book_003','Great Expectations','Charles Dickens','15']
  ];
  function bookCard(d,k,x,y,w,book,active=false) {
    box(d,k,x,y,w,145,'',active,P.green);
    text(d,k+'-title',x+w/2,y+37,book[1],30);
    text(d,k+'-author',x+w/2,y+83,book[2],27,P.muted);
    text(d,k+'-id',x+w/2,y+120,book[0],24,P.green);
  }

  scene('NoSQL',['One bookstore','Three decisions'],(d,s)=>{
    d.text('course',80,135,'DS 2022 · Lecture 06',30,P.green,'start',650);
    d.text('name',80,235,'NoSQL',88,P.ink,'start',650);
    d.text('story',80,335,'One bookstore. Shared facts. Changing data.',35,P.muted,'start');
    if(s){text(d,'shape',245,465,'Represent',35);text(d,'ownership',640,465,'Update',35);text(d,'copies',1040,465,'Read',35);}
  },{
    idea:'We will design and change one bookstore to connect document shape, shared facts, and database guarantees.',
    builds:['Point to the bookstore story. Ask students to imagine maintaining a catalog where readers look up books, staff edit author details, and checkout updates inventory.','Point to Represent, Update, and Read. Explain that we will keep using the same store while asking where facts belong, what queries return, and which checkout changes must happen together.'],
    question:'What could go wrong if the bookstore stores the same fact in more than one place?',
    answer:'One copy might be updated while another remains old, so readers can receive different answers.',
    context:'The 59-minute route includes transitions, discussion, and two activity breaks. A 75-minute class has 16 minutes available for questions and additional practice. The companion holds the source dates, setup, exam information, and additional database topics.'
  },'1–2',{kind:'title',minutes:1});

  scene('Hierarchical file formats',['JSON: nested objects','XML: nested elements','YAML: indentation','TOML: table headers'],(d,s)=>{
    title(d,'Hierarchical file formats');
    box(d,'book',210,200,200,75,'book',true,P.green,32);
    box(d,'title',90,345,230,75,'title: Emma',false,P.green,29);
    box(d,'author',365,345,200,75,'author',true,P.green,30);
    box(d,'name',330,480,270,75,'name: Jane Austen',false,P.green,27);
    d.arrow('book-title',285,290,205,330,P.line,3);
    d.arrow('book-author',340,290,465,330,P.green,3);
    d.arrow('author-name',465,435,465,465,P.green,3);
    const examples=[
      {name:'JSON',lines:['{','  "title": "Emma",','  "author": {','    "name": "Jane Austen"','  }','}'],cue:'Braces nest objects',use:'Data exchange'},
      {name:'XML',lines:['<book>','  <title>Emma</title>','  <author>','    <name>Jane Austen</name>','  </author>','</book>'],cue:'Tags nest elements',use:'Structured documents'},
      {name:'YAML',lines:['title: Emma','author:','  name: Jane Austen'],cue:'Indentation shows nesting',use:'Configuration'},
      {name:'TOML',lines:['title = "Emma"','','[author]','name = "Jane Austen"'],cue:'Table headers define structure',use:'Project configuration'}
    ];
    const example=examples[s];
    d.text('format',660,175,example.name,38,P.green,'start',650);
    code(d,'example',example.lines,660,240,29,46,-1,540);
    d.text('format-cue',660,565,example.cue,29,P.green,'start');
    d.text('format-use',660,615,example.use,27,P.muted,'start');
  },{
    idea:'Hierarchical file formats can represent a book with author information nested inside it.',
    builds:[
      'Trace book to author to name in the diagram. Point to the nested braces in JSON; they hold the author object inside the book. JSON is common for exchanging application data.',
      'Keep the same book in view and point to the matching XML tags. The author element contains a name element. XML is common for structured documents and data exchange.',
      'Point to the spaces before name in YAML. Here indentation puts name under author. YAML is often used for configuration; these spaces carry meaning.',
      'Point to [author] in TOML. This table header puts the following name inside author. Connect TOML to pyproject.toml from scripting, then return to JSON for our book documents.'
    ],
    question:'What stays the same when the format changes?',
    answer:'The book is still Emma, and the author name is still nested inside author. The notation for that structure changes.',
    context:'Spend about 30 seconds per format. These are equivalent book facts, not a promise that every format has identical types or parser output. XML uses a book root element; the other snippets describe the book at the root. YAML also permits flow syntax; TOML table headers, not indentation, define this grouping. Format choice does not determine validation policy. Detailed syntax remains in the companion.'
  },'7–12',{id:'hierarchical-formats',minutes:2,sources:['https://www.rfc-editor.org/rfc/rfc8259','https://www.w3.org/TR/xml/','https://yaml.org/spec/1.2.2/','https://toml.io/en/v1.0.0']});

  scene('Two books, one author',['The catalog','A fact shared by both'],(d,s)=>{
    title(d,'Two books, one author');bookCard(d,'first',115,220,465,BOOKS[0],true);bookCard(d,'second',700,220,465,BOOKS[1],true);
    if(s){text(d,'bio',640,445,'Jane Austen · English novelist',35,P.green);text(d,'question',640,510,'Where should this fact live?',31,P.muted);}
  },{
    idea:'The bookstore has separate books that share information about one author.',
    builds:['Read the two titles and their different identifiers. Ask which facts describe an individual book and which facts describe their shared author.','Point to the biography below the books. Explain that correcting this shared text should not require guessing which copies students or customers will read.'],
    question:'Does changing Jane Austen’s biography mean that either book becomes a different book?',
    answer:'No. Each book keeps its identity; the shared author information changes.',
    context:'Book titles and authors are real. Prices, tags, review examples, and operational changes in this lecture are illustrative. Begin with embedded author details, then explicitly compare a reference design later.'
  },'29–30',{id:'a-bookstore-model',minutes:2});

  scene('Four NoSQL families',['Different useful shapes','Today: documents'],(d,s)=>{
    title(d,'Four NoSQL families');
    const labels=['Key–value','Document','Wide-column','Graph'],examples=['Cart by key','Book details','Partitioned events','Reader connections'];
    labels.forEach((v,i)=>{box(d,'family-'+i,90+(i%2)*600,190+Math.floor(i/2)*175,500,105,v,s===1&&i===1,P.green,35);text(d,'example-'+i,340+(i%2)*600,322+Math.floor(i/2)*175,examples[i],28,P.muted);});
  },{
    idea:'NoSQL includes several data-model families, and this lecture focuses on documents.',
    builds:['Read one bookstore use beside each family: a cart lookup, a book record, partitioned event data, and connected readers. Explain that each model emphasizes a different way to organize and access information.','Point to the highlighted Document box. Say that the rest of the class follows book documents; the family name alone does not determine transactions, validation, or performance.'],
    question:'Which family naturally represents one book with named fields and nested author details?',
    answer:'The document model is a natural representation for that shape.',
    context:'Keep this overview to two minutes. Wide-column systems organize access around partition keys and related columns; this is not the same concept as analytical column-oriented storage. Products can support several models. The graph link is an optional extension, not a scheduled activity break.'
  },'14–16',{activity:'graph',minutes:2});

  scene('JSON objects',['One object','Fields and values','Types matter'],(d,s)=>{
    title(d,'One book as JSON');code(d,'book',['{','  "_id": "book_001",','  "title": "Pride and Prejudice",','  "price": 18','}'],110,195,34,60,[0,2,3][s]);
    text(d,'caption',930,465,['One book','Named values','18 is a number'][s],31,P.green);
  },{
    idea:'A JSON object represents one book as named values enclosed in braces.',
    builds:['Point to the opening and closing braces. Read this as one book record, not a separate record for every displayed line.','Point to title and its string value. Explain that JSON uses double quotes around property names and strings, with commas between members.','Point to price and the unquoted number 18. Ask students how this differs from storing the quoted string "18".'],
    question:'Which visible value is a number rather than a string?',
    answer:'The price value 18 is a number; the identifier and title are strings.',
    context:'The displayed snippet is valid JSON. JSON also supports arrays, booleans, and null; avoid comments, trailing commas, and duplicate keys. The bookstore prices are synthetic. https://www.rfc-editor.org/rfc/rfc8259'
  },'8, 27',{activity:'json',minutes:3});

  scene('A nested author',['The outer book','The inner author'],(d,s)=>{
    title(d,'A nested author');code(d,'book',['{','  "_id": "book_001",','  "author": {','    "name": "Jane Austen",','    "bio": "English novelist"','  }','}'],110,180,32,46,s?3:1);
    text(d,'caption',955,460,s?'Object inside object':'Book document',30,P.green);
  },{
    idea:'A document can contain another object that groups related fields.',
    builds:['Point to book_001 in the outer object. Explain that we have added author details inside the same book document.','Trace the braces around author, then point to name and bio. Those two fields belong to the nested author object rather than directly to the book.'],
    question:'Is author itself a string in this document?',
    answer:'No. It is an object containing the name and bio strings.',
    context:'This is the embedded-author design used by the browser document activity. The reference design later replaces this nested object with author_id. A document model can still apply validation rules. '+MONGO+'core/document/'
  },'18, 27, 30',{id:'documents-keep-related-fields',activity:'json',minutes:2});

  scene('JSON arrays',['An ordered list','Choose one position'],(d,s)=>{
    title(d,'An array inside the book');code(d,'array',['{','  "tags": ["fiction", "classics"]','}'],110,180,34,54,1);
    ['fiction','classics'].forEach((value,i)=>{box(d,'tag-'+i,280+i*410,350,300,95,value,s===1&&i===1,P.green,35);text(d,'index-'+i,430+i*410,485,String(i),30,P.muted);});
  },{
    idea:'An array keeps a list of values in order, with positions commonly accessed using zero-based indexes.',
    builds:['Point to the square brackets and read the two tags in order. Contrast this list with the named fields inside the author object.','Point to index 1 beneath classics. Explain that Python and JavaScript start array or list positions at zero, so the second item has index one.'],
    question:'Which tag would tags[0] select?',
    answer:'It selects fiction, the first item.',
    context:'The tags are illustrative metadata for this bookstore example. JSON defines an ordered array; the consuming programming language or query tool provides indexing. https://www.rfc-editor.org/rfc/rfc8259'
  },'8',{activity:'json',minutes:2});

  scene('Follow a JSON path',['Start with the book','Choose author','Choose name'],(d,s)=>{
    title(d,'Follow a JSON path');
    ['book','author','Jane Austen'].forEach((value,i)=>{box(d,'path-'+i,105+i*395,235,280,100,value,i===s,P.green,33);if(i<2)d.arrow('edge-'+i,400+i*395,285,485+i*395,285,P.green,3);});
    code(d,'expression',['book["author"]["name"]'],345,450,35);
  },{
    idea:'A nested lookup chooses one container at a time until it reaches the needed value.',
    builds:['Point to book as the parsed root object. Read the expression from left to right before following it.','Point to author and explain that the first lookup returns an object, so there is still another step.','Point to Jane Austen and read the final name lookup. Connect this route to the author.name field path we will use in a database filter.'],
    question:'What would book["author"] return without the final lookup?',
    answer:'It would return the whole nested author object, including name and bio.',
    context:'The expression is access to parsed data, not JSON text syntax. MongoDB uses dotted field paths such as author.name in filters. The JSON activity remains available as an optional extension; it is not one of today’s two breaks. '+MONGO+'core/field-paths/'
  },'8, 13, 27',{activity:'json',minutes:3});

  scene('MongoDB documents',['A readable representation','A stored document'],(d,s)=>{
    title(d,'What MongoDB stores');
    if(s===0)code(d,'json',['{','  "_id": "book_001",','  "price": 18','}'],210,225,38,63);
    else{flow(d,['Application','BSON document','MongoDB'],1,245);text(d,'types',640,435,'Named fields · nested values · types',32,P.green);}
  },{
    idea:'MongoDB stores BSON documents, while JSON is a readable representation we can use to discuss their shape.',
    builds:['Read the small JSON representation and identify the same book and price. Explain that a displayed text representation is not the database’s storage encoding.','Follow the application through BSON to MongoDB. Explain that BSON preserves typed values and also supports types, such as dates, beyond ordinary JSON.'],
    question:'Does a price that looks numeric inside a quoted JSON string automatically become a numeric field?',
    answer:'No. The application must supply the intended value type; a string remains a string unless converted.',
    context:'Keep BSON detail brief. The browser activities use JSON-compatible values, while a real MongoDB driver encodes supported values as BSON. XML from the source is an alternative representation to parse, not MongoDB’s native storage format. '+MONGO+'core/document/ ; '+MONGO+'reference/bson-types/'
  },'25–27',{minutes:2});

  scene('Collection and identity',['A collection of books','Choose a document','Keep its identity'],(d,s)=>{
    title(d,'Collection and identity');d.rect('collection',80,175,1120,305,P.white,P.line,10,2);text(d,'collection-name',640,210,'ds2022_lecture06 → books',31,P.green);
    bookCard(d,'first',115,270,470,BOOKS[0],s===1);bookCard(d,'second',695,270,470,BOOKS[1],s===2);
    if(s===2)text(d,'rule',640,525,'_id identifies the document, not its current content',29,P.muted);
  },{
    idea:'A collection groups documents, and each document’s _id gives it a stable identity.',
    builds:['Point to the course database and its books collection. Read the two cards as separate documents inside that collection.','Point to book_001 and explain that a filter can choose this record precisely. A title or author name may be shared by other records.','Point to book_002 and the identity rule. Explain that editing a price or biography should not change which book the identifier names.'],
    question:'Could these two documents have the same _id in this ordinary collection?',
    answer:'No. Their _id values must be unique within the collection.',
    context:'The course deliberately supplies string IDs. ObjectId is a common generated default, not the only allowed identifier type. In standard collections, _id is required and immutable. Sharding and specialized collection types add details outside this lecture. '+MONGO+'core/document/ ; '+MONGO+'core/databases-and-collections/'
  },'28, 30',{id:'database-and-collection',minutes:3});

  scene('Flexible still needs rules',['An optional field','A required type'],(d,s)=>{
    title(d,'Flexible still needs rules');
    if(s===0){box(d,'one',120,215,465,160,'Book with tags',true,P.green,35);box(d,'two',695,215,465,160,'Book without tags',true,P.blue,35);text(d,'optional',640,470,'Optional does not mean invalid',33,P.green);}
    else{code(d,'values',['"price": 18','"price": "18"'],165,235,38,100,0,500);box(d,'rule',790,215,365,170,'Require a number',true,P.green,31);text(d,'validation',640,495,'Declared validation can reject a write',31,P.muted);}
  },{
    idea:'Flexible document shape can coexist with declared rules about required fields and value types.',
    builds:['Point to the two books and explain that tags may be optional in this application. A missing field is not automatically an error if the model permits it.','Point to the two price values and the number rule. Explain that collection validation can reject the string when the application requires a number.'],
    question:'Does using documents mean that the database cannot require a numeric price?',
    answer:'No. A collection can declare validation rules, including a required numeric type.',
    context:'This is an example of a chosen validation rule, not a rule enabled automatically by MongoDB. Representation format and validation policy are separate choices. '+MONGO+'core/schema-validation/'
  },'12, 18, 27',{id:'format-and-validation',minutes:2});

  scene('Find matching documents',['Read the filter','Follow the field path','Identify matches'],(d,s)=>{
    title(d,'Ask for Austen’s books');code(d,'query',['db.books.find({"author.name": "Jane Austen"})'],95,175,31,46,s===1?0:-1,1080);
    table(d,'books',105,275,[220,530,330],[['_id','title','author.name'],...BOOKS.map(row=>row.slice(0,3))],{rowHeight:61,fontSize:28,highlightRows:s===2?[1,2]:[]});
  },{
    idea:'A find filter chooses documents whose field values match the requested condition.',
    builds:['Read the call from left to right: books is the collection, find is the operation, and the object is its filter. Ask students to predict how many of the three rows should match.','Point to author.name and connect it to the nested lookup from earlier. The condition compares that value with the string Jane Austen.','Point to the two highlighted Austen rows. Great Expectations does not match because this document names Charles Dickens.'],
    question:'How many documents should this filter return in the displayed collection?',
    answer:'Two: Pride and Prejudice and Emma.',
    context:'The table is a teaching view of selected document fields. These are embedded author objects, matching the browser activity; a later reference design changes the query path. A find result is not guaranteed to have a particular order without sorting. '+MONGO+'crud/'
  },'35',{activity:'documents',minutes:3});

  scene('From matches to results',['Start with three books','Return two matches'],(d,s)=>{
    title(d,'From matches to results');text(d,'stored',330,165,'Stored collection',30,P.muted);text(d,'returned',975,165,'Query result',30,P.green);
    BOOKS.forEach((book,i)=>{box(d,'stored-'+i,95,220+i*95,470,70,book[1],s===1&&i<2,P.green,29);});
    d.rect('result',750,205,435,240,P.white,s?P.green:P.line,8,2);
    if(s){BOOKS.slice(0,2).forEach((book,i)=>{d.arrow('match-'+i,585,255+i*95,730,255+i*95,P.green,4);text(d,'returned-'+i,968,255+i*95,book[1],29);});}
    text(d,'unchanged',640,520,'A read leaves all three stored documents unchanged',30,P.muted);
  },{
    idea:'A query returns selected documents without removing nonmatching documents from the collection.',
    builds:['Count the three stored books and point to the empty result area. Ask students to distinguish the stored collection from the answer to one question.','Follow the matching books into the result. Point back to Great Expectations, which remains stored even though it was not returned.'],
    question:'After this find, how many documents remain stored?',
    answer:'All three remain. The query returned two matches but did not delete anything.',
    context:'A real find operation returns a cursor that the client can consume. This diagram emphasizes selection and unchanged storage, not cursor batches or network behavior.'
  },'35',{activity:'documents',minutes:3});

  scene('Update a matching document',['Choose one book','Set its price','Inspect the stored value'],(d,s)=>{
    title(d,'Change one price');code(d,'update',['db.books.updateOne(','  {_id: "book_001"},','  {$set: {price: 20}}',')'],85,225,31,65,s===0?1:s===1?2:-1,635);
    table(d,'prices',800,230,[230,155],[['_id','price'],['book_001',s===2?'20':'18'],['book_002','24'],['book_003','15']],{rowHeight:62,fontSize:28,highlightRows:s===2?[1]:[]});
  },{
    idea:'An update pairs a filter that identifies a document with an operation that changes selected fields.',
    builds:['Point to the _id filter and match book_001 to the first row. Using the unique identifier makes the target unambiguous.','Point to $set and the new price. Explain that the requested change is to price, not a replacement of the whole document.','Point to 20 in the first row and compare the other two prices. Only the selected book changed; its title, author, and identifier remain.'],
    question:'Would this operation also change Emma because it has the same author?',
    answer:'No. The filter selects book_001, not every book by Jane Austen.',
    context:'updateOne changes at most one matched document. With no match it makes no change unless an explicit upsert option is used. The prices are synthetic. '+MONGO+'crud/'
  },'35',{activity:'documents',minutes:3});

  exercise('documents','Find books',5,['Predict Austen’s matches; choose Find books.','Repeat with Charles Dickens.'],'Did finding change the stored books?','35',{
    idea:'Compare two filters and distinguish their results from the unchanged stored collection.',
    builds:['Open Find books with the green ↗ link, reset, and allow five minutes including discussion. Predict Jane Austen’s matches, choose Find books, then select Charles Dickens and run the same simple task. Use the final minute to compare the match counts and explain why the number of stored books did not change.'],
    question:'Why can the result change from two books to one while the collection still contains three?',
    answer:'Changing the author changes the filter’s matches; find reads documents without changing the stored collection.',
    context:'Use only the default Author selector and Find books button. The five-minute block includes opening, resetting, the two comparisons, and the debrief; do not add an extra activity discussion afterward.'
  },'exercise-document-operations');

  scene('Which document owns the author?',['One fact used twice','A correction arrives'],(d,s)=>{
    title(d,'Which document owns the author?');
    bookCard(d,'first',105,200,475,BOOKS[0]);bookCard(d,'second',700,200,475,BOOKS[1]);
    box(d,'fact',350,425,580,90,s?'Revised author biography':'One shared author biography',true,s?P.orange:P.green,32);
    d.line('first-use',340,365,500,410,P.line,3);d.line('second-use',935,365,780,410,P.line,3);
  },{
    idea:'A shared author fact needs an intentional owner and an update plan.',
    builds:['Point to the same author beneath two different books. Ask whether the biography is fundamentally a fact about a book or about the author.','Point to the revised biography and ask where a correction must be written. Explain that we will compare storing copies inside books with storing one shared author document.'],
    question:'What must we decide before implementing this biography correction?',
    answer:'We must decide where the authoritative biography lives and which stored values need updating when it changes.',
    context:'The revision is a synthetic editorial change, not a new historical claim about Jane Austen. This is a question about ownership and update responsibility, not a rule that every related fact must be stored separately.'
  },'30–31',{id:'which-document-owns-the-author',activity:'modeling',minutes:3});

  scene('Embed author details',['Both books contain a copy','Update only one copy'],(d,s)=>{
    title(d,'Copy the author into each book');
    [['book_001','Pride and Prejudice'],['book_002','Emma']].forEach((book,i)=>{
      box(d,'book-'+i,100+i*610,190,470,305,'',true,P.green);text(d,'title-'+i,335+i*610,230,book[1],29);text(d,'id-'+i,335+i*610,280,book[0],25,P.muted);
      box(d,'author-'+i,130+i*610,325,410,125,'',s===1&&i===0,s===1&&i===0?P.orange:P.blue);
      text(d,'name-'+i,335+i*610,360,'author.name: Jane Austen',26);text(d,'bio-'+i,335+i*610,413,s===1&&i===0?'bio: revised':'bio: original',30);
    });
  },{
    idea:'Copying an author into each book makes each book self-contained but creates several stored biographies to maintain.',
    builds:['Point to the author object inside each book’s boundary. A read of either book can include the author details without a separate lookup.','Point to revised inside book_001 and original inside Emma. Explain that changing one embedded copy does not automatically update the other book.'],
    question:'Why does Emma still show the original biography immediately after this update?',
    answer:'Emma has its own embedded copy, and that separate stored value was not updated.',
    context:'Embedding a biography inside one owning author document differs from copying an author object into many books. This comparison uses the latter design to expose duplicate-update responsibility. '+MONGO+'data-modeling/concepts/embedding-vs-references/'
  },'31, 33–34',{id:'embed-a-biography',activity:'modeling',minutes:2});

  scene('Reference one author',['Replace the embedded object','Follow the matching identifier','Update the shared fact'],(d,s)=>{
    title(d,'Reference one author');
    code(d,'book-one',['{ "_id": "book_001",','  "author_id": "author_001" }'],75,205,27,55,s===0?1:-1,540);
    code(d,'book-two',['{ "_id": "book_002",','  "author_id": "author_001" }'],75,390,27,55,s===0?1:-1,540);
    code(d,'author',['{','  "_id": "author_001",','  "name": "Jane Austen",',`  "bio": "${s===2?'revised':'original'}"`,'}'],750,220,27,50,s===1?1:s===2?3:-1,425);
    if(s>=1){d.arrow('reference-one',620,260,730,270,P.green,3);d.arrow('reference-two',620,445,730,285,P.green,3);}
  },{
    idea:'A reference replaces copied author details with an identifier that points to one shared author document.',
    builds:['Point to author_id in both book documents. Explicitly compare it with the earlier author object: the book no longer stores author.name or author.bio in this design.','Match each author_id to the author document’s _id. Explain that the application or an appropriate database query must perform that lookup to obtain the author’s name or biography.','Point to the revised biography in the shared document. Both books still reference the same author, so there is only one stored biography to edit in this design.'],
    question:'Will the earlier author.name filter work unchanged on these book documents?',
    answer:'No. They now store author_id instead of a nested author object; finding by author name requires resolving the author and using the reference.',
    context:'MongoDB does not automatically enforce a SQL-style foreign key for these application-level references. The singular author_id keeps this comparison simple; the downloadable example uses author_ids to permit coauthors. '+MONGO+'data-modeling/concepts/embedding-vs-references/'
  },'31–32',{id:'reference-a-biography',activity:'modeling',minutes:2});

  scene('Choose embed or reference',['Read together','Share updates','Bound the growth'],(d,s)=>{
    title(d,'Choose from the workload');
    const rows=[['Read together','Small embedded details'],['Shared updates','One referenced author'],['Growing reviews','Separate review documents']];
    table(d,'choices',110,210,[480,580],[['Need','Candidate design'],...rows],{rowHeight:73,fontSize:31,highlightRows:[s+1]});
  },{
    idea:'Access patterns, shared updates, and growth determine whether embedding or referencing fits a fact.',
    builds:['Point to read together and small embedded details. Explain why bounded information usually retrieved with one owner can be a useful embedded value.','Point to shared updates and the referenced author. Connect this choice to the biography that several books use.','Point to growing reviews and imagine a popular book gaining thousands of entries. A separate review collection can keep the book document bounded and support independent review access.'],
    question:'What concern makes an unlimited review array different from a short biography?',
    answer:'The review array can keep growing, increasing the book document’s size and complicating independent access and updates.',
    context:'These are design candidates, not performance guarantees. Standard BSON documents have a 16 MiB limit. The model must state whether an embedded list is truly bounded or merely starts small. '+MONGO+'core/document/ ; '+MONGO+'data-modeling/'
  },'34',{id:'choose-embed-or-reference',activity:'modeling',minutes:3});

  exercise('modeling','Embed or reference',5,['Update the biography in each design.','Compare what both books show.'],'Which stored facts changed?','34',{
    idea:'The storage design determines how many biographies an update must maintain.',
    builds:['Open Embed or reference with the green ↗ link, reset, and allow five minutes including discussion. Choose Update biography in the copy design, then switch to One shared author and update again; switching designs starts a fresh comparison. Return ready to explain why Emma stays old in the first design but both books show the change in the second.'],
    question:'Why does updating the shared author affect what both books show?',
    answer:'Both books refer to one author document, so the displayed biography comes from the same updated stored fact.',
    context:'Use the default design selector and Update biography button. The time includes opening, two comparisons, and the debrief. Leave review-growth and custom-text controls for later exploration.'
  },'exercise-embed-or-reference');

  scene('An atomic document update',['Before the update','One operation','After the update'],(d,s)=>{
    title(d,'One document, one atomic update');
    table(d,'book',125,205,[285,250],[['book_001','Value'],['price',s===2?'22':'20'],['inStock',s===2?'false':'true']],{rowHeight:75,fontSize:32,highlightRows:s===2?[1,2]:[]});
    if(s>=1){d.rect('boundary',100,180,585,280,'none',P.green,12,4);code(d,'set',['$set: {','  price: 22,','  inStock: false','}'],810,220,31,56,-1,350);}
    text(d,'rule',640,520,s===2?'Both fields changed together':'One update has one atomic boundary',32,P.green);
  },{
    idea:'An atomic single-document update applies its changes together rather than committing only some fields.',
    builds:['Read the current price of 20, left by our earlier update, and the inStock value for book_001. Explain that the next update changes both fields.','Trace the boundary around this document and read the two fields in $set. Ask whether the operation should commit the new price of 22 but leave its other requested change unapplied.','Point to both changed values. Explain that this one-document write is atomic; that promise does not automatically cover writes to other documents.'],
    question:'What does atomicity rule out for this one update?',
    answer:'It rules out committing only part of this update’s requested field changes.',
    context:'The field changes illustrate a boundary, not a full pricing or stock-management policy. MongoDB writes are atomic at the single-document level; atomicity is available in NoSQL systems as well as relational databases. '+MONGO+'core/write-operations-atomicity/'
  },'36–37',{minutes:3});

  scene('Choose the atomic boundary',['Checkout changes two documents','A failure between writes','An explicit transaction'],(d,s)=>{
    title(d,'Checkout crosses documents');
    box(d,'inventory',110,235,460,130,'Inventory: 1 → 0',s===2,P.green,34);box(d,'order',710,235,460,130,'Order: create one',s===2,P.green,34);
    if(s===1){d.arrow('between',590,300,690,300,P.orange,4);text(d,'failure',640,435,'Failure between writes?',35,P.orange);}
    if(s===2){d.rect('transaction',80,190,1120,230,'none',P.green,12,4);text(d,'together',640,490,'Commit the group together',35,P.green);}
  },{
    idea:'A checkout that changes separate documents needs an intentional transaction boundary if those changes must commit together.',
    builds:['Point to inventory and the order as two documents. Describe the intended checkout: use the last copy and create its order.','Point between the writes and ask what happens if the first succeeds but the second never completes. The application could otherwise leave changed inventory without the corresponding order.','Trace the transaction boundary around both changes. Explain that a supported transaction can commit or abort the group, while the application must still check stock and handle errors correctly.'],
    question:'Does writing these two calls consecutively make them one atomic transaction?',
    answer:'No. The application must use the supported transaction mechanism when the writes need a shared atomic boundary.',
    context:'This is a conceptual checkout, not executable reservation logic. A real implementation also needs conditional stock checks and concurrency/error handling. MongoDB multi-document transactions require a supported deployment. Avoid replacing the model question with an ACID acronym tour. '+MONGO+'core/transactions/'
  },'37',{minutes:3});

  // These source topics remain available without extending the live lecture.
  const supplementalSources=[
    {title:'Original review, assignments, and meeting logistics',source:'lectures/lecture-06/index.html#logistics',sourceSlides:[3,4,5,6,40,41,42,43,44,45]},
    {title:'Key-value, wide-column, and graph models',source:'lectures/lecture-06/index.html#models',sourceSlides:[17,19,20,21]},
    {title:'Time-series, ledger, and vector systems',source:'lectures/lecture-06/index.html#specialized',sourceSlides:[22,23,24]},
    {title:'Replica consistency and BASE',source:'lectures/lecture-06/index.html#replication-reference',sourceSlides:[38]},
    {title:'WORM retention',source:'lectures/lecture-06/index.html#worm',sourceSlides:[39]}
  ];
  window.COURSE_DECKS=window.COURSE_DECKS||{};
  window.COURSE_DECKS[6]={id:6,title:'NoSQL',date:'59-minute core lecture',durationMinutes:59,source:'lectures/lecture-06/index.html',scenes,supplementalSources};
})();
