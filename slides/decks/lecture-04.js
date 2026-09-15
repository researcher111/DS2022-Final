/* Lecture 04: Scripting. Adapted from the supplied 57-slide PowerPoint.
 * Native SVG uses the course's DeckViz primitives. The lower canvas is kept
 * open for handwriting. Code is displayed, never evaluated by the browser.
 */
(function () {
  'use strict';
  const P = window.DeckViz.palette;
  const scenes = [];
  const BASH = 'https://www.gnu.org/s/bash/manual/html_node/';
  const UV = 'https://docs.astral.sh/uv/';
  const PY = 'https://docs.python.org/3/';
  const title = (d, value) => d.text('heading',80,88,value,46,P.ink,'start',650);
  const text = (d,k,x,y,value,size=30,color=P.ink) => d.text(k,x,y,value,size,color);
  function code(d,k,lines,x=110,y=205,size=32,gap=46,active=-1) {
    lines.forEach((value,i)=> {
      if(i===active)d.rect(k+'-highlight-'+i,x-18,y+i*gap-22,1060,43,P.greenLight,'none',4,0);
      d.add(k+'-'+i,'text',{x,y:y+i*gap,fill:i===active?P.green:P.ink,'font-size':size,'font-family':'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace','text-anchor':'start','dominant-baseline':'middle','xml:space':'preserve'},value);
    });
  }
  function box(d,k,x,y,w,h,label,active=false,color=P.green,size=30) {
    d.box(k,x,y,w,h,label,active?(color===P.blue?P.blueLight:color===P.orange?P.orangeLight:P.greenLight):P.white,active?color:P.line,size);
  }
  function flow(d,labels,s,y=300) {
    const w=240,gap=105,start=(1280-(labels.length*w+(labels.length-1)*gap))/2;
    labels.forEach((label,i)=>{
      box(d,'flow-'+i,start+i*(w+gap),y,w,94,label,i===s);
      if(i<labels.length-1)d.arrow('flow-arrow-'+i,start+i*(w+gap)+w+12,y+47,start+(i+1)*(w+gap)-12,y+47,P.green,4);
    });
  }
  function scene(name,states,draw,notes,sourceSlides,extra={}) {
    const sourceNumbers=sourceSlides.split(',').flatMap(part=>{
      const ends=part.trim().split(/[–-]/).map(Number);
      return ends.length===1?ends:Array.from({length:ends[1]-ends[0]+1},(_,i)=>ends[0]+i);
    });
    scenes.push(Object.assign({id:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),title:name,kind:'visual',states,steps:states.length,draw,minutes:2,sourceSlides:sourceNumbers,notes:'Source PowerPoint slides '+sourceSlides+'.\n\n'+notes},extra));
  }

  scene('Scripting',['The lecture','The route'],(d,s)=>{
    d.text('course',80,135,'DS 2022',30,P.green,'start',650);
    d.text('name',80,235,'Scripting',80,P.ink,'start',650);
    d.text('date',80,330,'September 15 & 17, 2026',30,P.muted,'start');
    if(s){text(d,'bash',225,445,'Bash',34);text(d,'python',615,445,'Python',34);text(d,'env',1030,445,'Environments',34);}
  },'The uploaded PowerPoint contains the September 15 scripting lecture and the September 17 environment/practice material. This deck preserves that sequence; the environment title is a natural stopping point for the first meeting. Ask what students have already automated. Explain that they will trace data, write small scripts, and run Python with project dependencies. The suggested scene timings include discussion and practice and can span both meetings.', '1–3, 44–46',{kind:'title',minutes:1});

  scene('Command pipeline',['Sort the input','Remove adjacent duplicates','Count output lines'],(d,s)=>{
    flow(d,['sort','uniq','wc -l'],Math.min(s,2),280);
    text(d,'input',200,215,'pear  apple  pear',30,P.blue);
    text(d,'stream',640,450,s===0?'apple  pear  pear':s===1?'apple  pear':'2',36,P.green);
    d.circle('packet',[295,640,985][s],248,14,P.orange);
  },'Ask students to predict each intermediate result for three input lines: pear, apple, pear. sort orders them; uniq removes adjacent duplicates; wc -l counts the two remaining lines. The labels show a tiny conceptual stream, not literal space-separated shell input. Rebuilds adapt the source pipeline image into editable commands and moving data. A pipe connects one command’s standard output to the next command’s standard input. Processes can run concurrently; the animation explains data transformations, not a real execution schedule. Open the pipeline activity so students can change the data and ordering.', '4',{kind:'definition',term:'Pipeline',definition:'Commands connected so one command’s output becomes another command’s input.',activity:'pipeline',minutes:3});

  scene('Scripting in ETL',['Extract','Transform','Load'],(d,s)=>{
    title(d,'Scripting in ETL');flow(d,['Extract','Transform','Load'],s,235);
    const labels=[['download','unpack'],['clean','validate'],['file','database']];
    labels[s].forEach((v,i)=>text(d,'detail-'+i,470+i*340,425,v,34,P.green));
  },'Ask where a script fits when collecting a compressed data export, cleaning it, and storing the result. Extract fetches or unpacks data. Transform makes the data appropriate for the next use. Load writes it to a destination such as storage or a database. These are responsibilities and may appear in one script or several programs. Reuse the pipeline mental model without suggesting that every ETL workflow is literally a shell pipeline.', '5',{minutes:2});

  scene('Data cleaning',['Values','Representation','Records'],(d,s)=>{
    title(d,'Data cleaning');
    const rows=[['Missing values','Type mismatches','Outliers'],['Encoding','Dates and formats','Names and capitalization'],['Duplicates','Irrelevant records','Validation']][s];
    rows.forEach((v,i)=>{d.circle('point-'+i,140,225+i*105,8,P.green);d.text('label-'+i,180,225+i*105,v,35,P.ink,'start');});
  },'Use a student-proposed dataset to name one check at each build. Values: distinguish missing, invalid type, and unusual but valid values. Representation: verify encoding, standardize dates and formats, reconcile inconsistent naming and capitalization, and inspect typos or spelling. Records: detect duplicates, remove only irrelevant data, and validate output. Ask which changes could destroy meaningful information. Expected: automatically dropping outliers, filling missing values without a rule, or merging distinct people by name. Transformation requires documented decisions.', '5',{minutes:2});

  scene('Script design',['One responsibility','An explicit contract','An unattended run'],(d,s)=>{
    title(d,'Script design');flow(d,['Input','Logic','Output'],1,240);
    if(s>=1){text(d,'validate',305,440,'Validate',31,P.blue);text(d,'errors',655,440,'Handle failure',31,P.orange);}
    if(s>=2)text(d,'log',1010,440,'Log progress',31,P.green);
  },'The source invokes the Unix principle of doing one thing well. Ask what another person needs to reuse a script: a clear purpose, expected input, predictable output, and defined failure behavior. Scripts can be attended and prompt the operator, or unattended in batch/scheduled execution. An unattended task needs its inputs supplied ahead of time. Bash suits combining shell programs; Python suits richer parsing and logic. R, JavaScript, and Perl are other choices. Portability, logging, testing a small example, and explicit error handling make a script maintainable.', '6–7',{minutes:2});

  scene('Shebang',['Interpreter selection','The first line'],(d,s)=>{
    code(d,'example',['#!/bin/bash','echo "Hello, world!"'],115,285,36,58,s===1?0:-1);
    if(s)text(d,'first',980,438,'Line 1',30,P.green);
  },'A shebang starts with #! on the first line and identifies the interpreter when the system directly executes the script. File extensions are naming conventions, not interpreter selection. Running bash greetings.sh explicitly selects Bash and does not require the executable bit on the script. Running ./greetings.sh requires executable permission and a usable interpreter line. A shebang is an operating-system execution convention, not a Python import or a command that runs when read as an ordinary shell comment.', '8–9, 12',{kind:'definition',term:'Shebang',definition:'The first script line identifies the interpreter used for direct execution.',minutes:2});

  scene('Interpreter paths',['A fixed interpreter','A PATH lookup'],(d,s)=>{
    title(d,'Interpreter paths');
    code(d,'shebang',[s?'#!/usr/bin/env python3':'#!/bin/bash'],110,225,37);
    flow(d,s?['env','PATH','python3']:['script','/bin/bash'],s?1:0,350);
  },'Compare the fixed /bin/bash path with /usr/bin/env python3. env searches PATH for python3, so the selected interpreter depends on the calling environment. The env executable itself must exist at /usr/bin/env for this example. Use command -v python3 to inspect command lookup. An absolute interpreter path is predictable on a configured machine but can fail on another. A PATH-based interpreter is more flexible but is not a guarantee of the same version everywhere. Prefer python3 here to avoid ambiguous python command names.', '8–9',{activity:'path',minutes:2,sources:[BASH+'Command-Search-and-Execution.html']});

  scene('Bash arguments',['The script','The invocation','The result'],(d,s)=>{
    title(d,'Bash arguments');
    code(d,'bash',['#!/bin/bash','NAME=$1','echo "Running script $0"','echo "Good morning, $NAME!"'],110,190,32,45,s===1?1:-1);
    if(s>=1)code(d,'call',['bash greetings.sh "Mr. Miller"'],110,408,32);
    if(s>=2)text(d,'out',640,492,'Good morning, Mr. Miller!',34,P.green);
  },'Write this as greetings.sh during the live demonstration. Ask how many arguments the quoted name supplies. Expected: one. $0 holds the name used to invoke the script; $1 is its first positional argument. NAME=$1 creates a shell variable with no spaces around the assignment operator. The script prints both the invocation name and the greeting; only the greeting is revealed on the slide. Quotes around "$NAME" keep the expanded value in one argument. This introductory script assumes an argument; a reusable version should check $# before reading $1.', '10–11',{minutes:3});

  scene('Executable permissions',['Explicit interpreter','Direct execution'],(d,s)=>{
    title(d,'Executable permissions');
    code(d,'run',s?['chmod u+x greetings.sh','./greetings.sh "Mr. Miller"']:['bash greetings.sh "Mr. Miller"'],110,220,36,67);
    text(d,'mode',640,425,s?'owner: read  write  execute':'owner: read  write',33,P.green);
  },'Compare explicit interpreter execution with direct execution. chmod u+x adds execute permission for the file owner. The source uses chmod +x or 755; 755 sets the complete mode to owner read/write/execute and group/others read/execute, while adding x changes only the requested permission bits. ls -l displays the permission string. The ./ prefix names a path in the current directory; the shell does not normally search the current directory just because a file is present. No .sh extension is required by the kernel.', '12',{minutes:2});

  scene('PATH search',['First directory','Next directory','First match'],(d,s)=>{
    title(d,'PATH search');code(d,'command',['greetings.sh "Mr. Miller"'],110,185,33);
    const dirs=['/usr/local/bin','$HOME/scripts','/usr/bin'];
    dirs.forEach((v,i)=>box(d,'dir-'+i,70+i*405,285,330,90,v,i===Math.min(s,1),P.green,29));
    d.arrow('search',235+Math.min(s,1)*405,410,235+Math.min(s,1)*405,380,P.orange,4);
    if(s===2)text(d,'found',640,480,'First matching executable wins',32,P.green);
  },'PATH is a colon-separated search list for external commands without a slash, after the shell resolves constructs such as functions and builtins. This diagram asks students to search directories in order and stop at the first matching executable. In the example, suppose the script is absent from the first directory and present in the second; on the final build identify that second directory. A slash in ./greetings.sh bypasses the PATH search for the script. Ask how reordering PATH could change python3 or another command. Use the activity to make that order visible.', '13, 15',{activity:'path',minutes:3,sources:[BASH+'Command-Search-and-Execution.html']});

  scene('A persistent PATH',['Current shell','Future interactive shells','Quoting'],(d,s)=>{
    title(d,'A persistent PATH');
    if(s===0)code(d,'setup',['mkdir -p "$HOME/scripts"','mv greetings.sh "$HOME/scripts/"','export PATH="$HOME/scripts:$PATH"'],100,200,32,62);
    if(s===1){code(d,'rc',['export PATH="$HOME/scripts:$PATH"'],100,210,32);text(d,'bashrc',340,350,'Bash: ~/.bashrc',33,P.blue);text(d,'zshrc',920,350,'Zsh: ~/.zshrc',33,P.green);text(d,'reload',640,455,'Reload the matching shell configuration',30,P.muted);}
    if(s===2){code(d,'tilde',['"~/scripts"','"$HOME/scripts"'],110,235,39,112);text(d,'literal',850,235,'literal ~',33,P.orange);text(d,'expanded',850,347,'expanded home',33,P.green);}
  },'Demonstrate these steps in the learner’s own shell and a disposable example location. Add the export line to the appropriate startup file and load that file with source ~/.bashrc for Bash or source ~/.zshrc for Zsh. Correction to source slides 13 and 29: Bash does not expand a quoted tilde either. "$HOME/scripts" expands HOME safely inside double quotes in both shells. Bash reads ~/.bashrc for interactive non-login shells. Login Bash reads the first available ~/.bash_profile, ~/.bash_login, or ~/.profile; that file can source ~/.bashrc. Do not tell students that .bashrc alone always configures login shells. Repeatedly sourcing a simple prepend can duplicate a PATH entry.', '13, 29',{minutes:3,sources:[BASH+'Tilde-Expansion.html','https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html']});

  scene('Environment inheritance',['Shell variable','Exported variable','Child process'],(d,s)=>{
    title(d,'Environment inheritance');
    code(d,'env',[s?'export PET="Rhesus Monkey"':'PET="Rhesus Monkey"'],100,185,34);
    box(d,'parent',145,295,330,100,'Shell',true,P.blue,34);
    box(d,'child',805,295,330,100,'pets.sh',s===2,P.green,34);
    d.arrow('inherit',495,345,785,345,s?P.green:P.line,5);
    text(d,'copy',640,450,s?'PET reaches the child':'PET stays in the shell',32,s?P.green:P.orange);
  },'Use a fresh variable to distinguish local shell state from exported environment state. PET="Rhesus Monkey" creates a shell variable; export marks it for subsequently launched child processes. pets.sh can contain echo "My favorite animal: $PET!". An unexported variable is not automatically available in the new script process. A variable previously marked for export keeps that attribute when assigned again, so use a fresh shell or export -n PET when contrasting the cases. unset PET removes the variable. Environment inheritance is a copy at process creation; children cannot update their parent shell’s environment.', '14, 16',{minutes:3,sources:[BASH+'Environment.html']});

  scene('Sources of input',['Arguments and environment','An interactive prompt','Files and embedded data'],(d,s)=>{
    title(d,'Sources of input');
    if(s===0){
      ['$0','$1','$2'].forEach((value,i)=>{
        code(d,'arg-'+i,[value],200+i*400,210,40);
        text(d,'arg-label-'+i,225+i*400,275,['Script name','First argument','Second argument'][i],30,P.blue);
      });
      code(d,'env-input',['export DATA_DIR="$HOME/data"'],110,380,36);
      d.text('env-label',110,440,'Exported environment variable',30,P.green,'start');
    }
    if(s===1){d.text('read-shell',110,190,'Bash',30,P.blue,'start');code(d,'read',['read -r -p "Name: " NAME'],110,270,36);text(d,'attended',640,400,'The shell pauses and waits for user input.',34,P.orange);}
    if(s===2){flow(d,['data.csv','script','result.csv'],1,250);text(d,'embedded',640,438,'Small defaults can live in the script',30,P.muted);}
  },'Have students choose an input channel for a filename, a machine-specific data directory, a one-time human answer, and a thousand records. $0 is the script invocation name; $1 and $2 are the first and second positional arguments. These parameters are separate from file descriptors 0, 1, and 2 for standard input, output, and error. Exported environment variables supply inherited configuration to child processes. read -r accepts backslashes literally and is useful for interactive input. The displayed read -p prompt syntax is Bash-specific. In Zsh, use read -r "NAME?Name: "; its -p option reads from a coprocess instead. In this interactive example, the shell pauses and waits for user input. Files hold larger data; a small embedded constant may be suitable for a default or test. A script launched unattended should not wait for a terminal prompt. Shell variables use NAME=value and unset NAME; the shell set builtin is not the ordinary assignment syntax.', '7, 16',{minutes:2,sources:['https://zsh.sourceforge.io/Doc/Release/Shell-Builtin-Commands.html']});

  scene('CSV and TSV',['Comma-separated columns','Tab-separated columns','The same table'],(d,s)=>{
    title(d,'CSV and TSV');
    if(s<2){code(d,'data',s?['id<TAB>name<TAB>score','1<TAB>Ada<TAB>90','2<TAB>Bob<TAB>85']:['id,name,score','1,Ada,90','2,Bob,85'],120,220,37,66);text(d,'delimiter',980,445,s?'tab':'comma',35,P.green);}
    else d.table('records',190,220,[180,390,300],[['id','name','score'],['1','Ada','90'],['2','Bob','85']],{rowHeight:79,fontSize:34});
  },'The source uses many synthetic person records to show rows and columns. This smaller example keeps the same concept legible. <TAB> denotes an actual tab character; it is a visual placeholder, not text to save into a TSV file. CSV fields may contain quoted delimiters, quotes, or embedded newlines. A line-oriented cut/split example is not a general CSV parser. Use a CSV-aware library for real CSV data. Ask whether reading the file automatically tells us the intended score type; parsing and validation are separate decisions.', '17–18',{minutes:2,sources:[PY+'library/csv.html']});

  scene('JSON structure',['Named fields','Nested values'],(d,s)=>{
    title(d,'JSON structure');
    code(d,'json',s?['{','  "name": "Ada",','  "scores": [90, 85],','  "address": {"city": "Charlottesville"}','}']:['{','  "id": 1,','  "name": "Ada",','  "score": 90','}'],110,195,33,57);
  },'Contrast a rectangular delimited file with JSON’s objects, arrays, strings, numbers, booleans, and null. Objects contain named key/value pairs and values can nest. Python commonly represents a decoded JSON object as a dict and an array as a list. The source image labels dates as ipv4; the example here removes that accidental mismatch. JSON uses double quotes around keys and strings. It is related to JavaScript syntax but should be parsed as data. Ask how a list of scores would fit into a single CSV column and what that would require from a reader.', '19',{minutes:2,sources:[PY+'library/json.html']});

  scene('Standard streams',['Input and output','A separate error stream'],(d,s)=>{
    title(d,'Standard streams');
    box(d,'in',70,265,250,85,'stdin  0',true,P.blue,33);box(d,'program',475,265,300,85,'Program',true,P.green,35);box(d,'out',960,220,250,85,'stdout  1',true,P.green,33);
    text(d,'in-caption',195,225,'Standard input',29,P.blue);text(d,'out-caption',1085,180,'Standard output',29,P.green);
    d.arrow('input',335,308,460,308,P.blue,4);d.arrow('output',790,290,945,260,P.green,4);
    if(s){box(d,'err',960,390,250,85,'stderr  2',true,P.orange,33);text(d,'err-caption',1085,350,'Standard error',29,P.orange);d.arrow('error',790,330,945,432,P.orange,4);}
  },'Use this diagram to make the source’s output choices concrete. Standard input, standard output, and standard error are file descriptors 0, 1, and 2. By default a terminal often displays both output streams, which can conceal the distinction. Ordinary | carries stdout to the next process; stderr continues to its current destination unless redirected. Ask where a warning should go if stdout is being consumed as CSV. Expected: keep data and diagnostics separate. Open the streams activity to route each stream independently.', '4, 20',{activity:'streams',minutes:3,sources:[BASH+'Redirections.html']});

  scene('Output redirection',['Replace','Append','Errors and discarded output'],(d,s)=>{
    title(d,'Output redirection');
    if(s===0){code(d,'replace',['echo "start" > run.log'],110,245,37);text(d,'effect',640,400,'Create or truncate',36,P.orange);}
    if(s===1){code(d,'append',['echo "done" >> run.log'],110,245,37);text(d,'effect',640,400,'Add at the end',36,P.green);}
    if(s===2)code(d,'routes',['python3 clean.py > clean.csv','python3 clean.py 2> errors.log','python3 clean.py > /dev/null'],110,220,33,77);
  },'Before revealing >, ask what happens if the destination already exists. The shell opens and normally truncates the file before running the command. >> appends. 2> redirects stderr. /dev/null discards data sent to it. The final build shows three separate alternative runs, not one command to execute repeatedly. Printing to a terminal, saving a result, discarding output, and logging execution have different purposes. For a single run that saves both streams separately: python3 clean.py > clean.csv 2> errors.log. Redirection order matters when duplicating descriptors with 2>&1.', '20',{activity:'streams',minutes:2,sources:[BASH+'Redirections.html']});

  scene('Bash conditionals',['The test','True branch','False branch'],(d,s)=>{
    title(d,'Bash conditionals');
    code(d,'if',['if [[ -f "data.txt" ]]; then','    echo "File exists"','else','    echo "File missing"','fi'],110,200,34,57,s===0?0:s===1?1:3);
  },'Ask what each possible state of data.txt does. [[ -f ... ]] succeeds for an existing regular file. It does not mean that a path of any type exists, nor does it promise that a later read will succeed. if uses command exit status: zero selects then. else handles the other outcome and fi closes the block. [[ ... ]] is Bash syntax; students should use a Bash shebang rather than assume every sh supports it. Have them predict the branch before running the control-flow activity.', '21',{activity:'control',minutes:3});

  scene('Bash tests',['Files','Numbers','Strings'],(d,s)=>{
    title(d,'Bash tests');
    const rows=[[['Test','Meaning'],['-f  -d  -e','file / directory / exists'],['-r  -w  -x','read / write / execute'],['-s','nonempty file']],[['Test','Meaning'],['-eq  -ne','equal / unequal'],['-lt  -le','less / less-or-equal'],['-gt  -ge','greater / greater-or-equal']],[['Test','Meaning'],['-z  -n','empty / nonempty'],['==  !=','equal / unequal'],['"$name" == "alice"','string comparison']]][s];
    d.table('tests',100,190,[490,590],rows,{rowHeight:76,fontSize:29});
  },'Use the table as an index of choices, then write an example in the open space: [[ "$count" -eq 5 ]] or [[ "$name" == "alice" ]]. Numeric and string comparisons express different tests. Within [[ ... ]], an unquoted right-hand side of == may be a pattern; quote a literal string. File predicates follow symbolic links in the usual cases, so -e can be false for a broken symlink. -s means an existing file with a size greater than zero. Ask students to choose a predicate for each case instead of memorizing the whole table at once.', '21–22',{minutes:3,sources:[BASH+'Bash-Conditional-Expressions.html']});

  scene('Bash array loops',['An array','The iteration','Preserved spaces'],(d,s)=>{
    title(d,'Bash array loops');
    code(d,'loop',['names=("Alice" "Bob Smith" "Carol")','for name in "${names[@]}"; do','    echo "Name: $name"','done'],90,190,32,59,s===0?0:s===1?1:2);
    text(d,'item',640,480,['Alice','Bob Smith','Carol'][s],36,P.green);
  },'Ask how many loop iterations occur. Expected: three, even though Bob Smith contains a space. Quoted "${names[@]}" expands each array element as a separate argument. The loop variable receives one item per iteration. do begins the body and done ends it. The source also shows numbers=(1 2 3 4 5), which uses the same loop shape. Bash array entries are shell values; writing digits in the array does not create Python-style numeric objects. Have students predict how removing the quotes changes an element that contains spaces.', '23',{minutes:3});

  scene('Loops over files',['Matching filenames','No matching files'],(d,s)=>{
    title(d,'Loops over files');
    code(d,'files',['shopt -s nullglob','for file in *.txt; do','    echo "Processing $file"','done'],110,205,33,63,s?0:1);
    text(d,'iterations',640,480,s?'No matches: zero iterations':'One iteration per matching file',32,s?P.orange:P.green);
  },'Globbing expands *.txt before the loop runs. In Bash, nullglob makes a pattern with no matches disappear instead of remaining the literal string *.txt. With nullglob enabled, no .txt files means zero iterations here. Quote "$file" when passing the selected filename to a command. The source uses this to introduce batched processing; it does not parse the contents of the files. shopt is Bash-specific. Ask what a filename containing a space does in this loop: it remains one loop item and the quoted expansion remains one argument.', '23',{minutes:2,sources:[BASH+'Filename-Expansion.html']});

  scene('Exit status',['Success','Failure','The most recent command'],(d,s)=>{
    title(d,'Exit status');
    code(d,'status',s===0?['true','echo $?']:s===1?['false','echo $?']:['false','echo "another command"','echo $?'],110,210,37,76);
    text(d,'answer',980,415,s===1?'1':'0',70,s===1?P.orange:P.green);
  },'Every command reports a status that the shell can use for control flow, diagnostics, and integration. Zero means success; nonzero means failure or another documented condition. true returns zero and false returns one, so these examples are portable demonstrations of the convention. $? expands to the most recently completed foreground pipeline’s status. The third build returns zero because echo succeeded after false. Capture status=$? immediately if you need it later. The source’s missing-file ls status is platform-specific and should not be taught as universally one.', '24–25',{minutes:3,sources:[BASH+'Exit-Status.html']});

  scene('Status conventions',['A command contract','Bash execution failures'],(d,s)=>{
    title(d,'Status conventions');
    const rows=s?[['Status','Bash meaning'],['126','cannot execute'],['127','command not found'],['128 + N','terminated by signal N']]:[['Status','Meaning'],['0','success'],['nonzero','check command documentation'],['exit 3','script chooses status 3']];
    d.table('statuses',135,200,[325,675],rows,{rowHeight:73,fontSize:31});
  },'Correction to source slide 26: status values one and two do not have universal meanings for all programs. Bash builtins commonly use two for incorrect usage, but another program can define it differently. Bash uses 126 for a found command that cannot execute, 127 for a missing command, and 128 plus the fatal signal number when a command terminates that way. Control-C commonly produces 130 for SIGINT (2). Do not teach 128 as a universal invalid-exit status or 255 as a universal out-of-range status. exit ends the script; return leaves a function or sourced script.', '26',{minutes:2,sources:[BASH+'Exit-Status.html']});

  scene('Short-circuit execution',['Sequential','AND','OR'],(d,s)=>{
    title(d,'Short-circuit execution');
    const lines=[['cmd1','cmd2'],['cmd1 && cmd2'],['cmd1 || cmd2']];
    code(d,'operators',lines[s],110,200,38,56);
    box(d,'a',190,355,280,88,'cmd1',true);box(d,'b',810,355,280,88,'cmd2',true,P.blue);
    d.arrow('condition',490,399,790,399,P.green,4);text(d,'rule',640,485,s===0?'after cmd1':s===1?'only after success':'only after failure',30,P.green);
  },'For a plain script without an exit-on-error setting or an explicit exit, successive lines continue regardless of the preceding command’s status. In cmd1 && cmd2, cmd2 runs only if cmd1 succeeds. In cmd1 || cmd2, cmd2 runs only if cmd1 fails. These lists short-circuit; they do not run both commands just to compute a Boolean value. Ask students to predict mkdir output && cd output when creation fails. Also explain that a && b || c is not a general replacement for if/else, because c can run when b fails.', '27',{activity:'control',minutes:3,sources:[BASH+'Lists.html']});

  scene('Bash error settings',['The settings','What they change','Explicit checks still matter'],(d,s)=>{
    title(d,'Bash error settings');code(d,'strict',['set -euo pipefail'],110,190,40);
    const labels=['-e   many unhandled failures','-u   unset-variable expansion','pipefail   failed pipeline stages'];
    if(s>=1)labels.forEach((v,i)=>d.text('flag-'+i,140,285+i*69,v,31,P.ink,'start'));
    if(s===2)text(d,'caveat',640,510,'-e has control-flow exceptions',30,P.orange);
  },'Use the ASCII command set -euo pipefail. -e exits on failures in many contexts, but tests in if/while/until, most positions in && and || lists, inverted statuses with !, and pipeline contexts have important exceptions. -u reports an error when expanding an unset parameter, subject to documented exceptions and supported default forms such as ${NAME:-default}. pipefail makes a pipeline return its rightmost nonzero component status, or zero when all succeed. These settings help reveal problems but cannot guarantee safe side effects, correct results, or complete error handling. Use explicit checks for expected failures and validate inputs.', '28',{minutes:3,sources:[BASH+'The-Set-Builtin.html']});

  scene('Bash checkpoint',['A prediction','A test'],(d,s)=>{
    title(d,'Bash checkpoint');code(d,'task',['test -f data.txt && echo "ready"'],110,235,35);
    text(d,'question',640,365,s?'Missing file: no greeting':'What changes when the file is missing?',34,s?P.green:P.ink);
    text(d,'practice',640,480,'class/03-scripting/bash',28,P.muted);
  },'Use the source course examples in class/03-scripting/bash as the practice handoff. Before running anything, ask students to predict the command’s output and status when data.txt exists and when it is missing. A missing file prevents echo from running. Have them add an explicit failure branch and explain what goes to stdout versus stderr. Use the activity links for quick experiments without requiring students to alter local shell settings. The original course examples are linked from the lecture reading.', '30',{kind:'activity',activity:'control',minutes:4,sources:['https://github.com/uvads/ds2022/tree/main/class/03-scripting/bash']});

  scene('Python scripting',['The same responsibilities','Richer structure'],(d,s)=>{
    title(d,'Python scripting');flow(d,['Input','Logic','Output'],1,240);
    if(s){text(d,'function',325,447,'Functions',33,P.blue);text(d,'error',665,447,'Exceptions',33,P.orange);text(d,'logging',1005,447,'Logging',33,P.green);}
  },'Python scripts share the Bash responsibilities already discussed: input, output, branching, looping, error handling, and logging. Python also supports named functions and structured data naturally. Ask students which parts of their shell script would stay as external commands and which might be easier to express as Python data transformations. There is no need to replace every command pipeline with Python; choose a tool appropriate to the work and the people maintaining it.', '31–32',{kind:'title',minutes:1});

  scene('Python arguments and environment',['Arguments','Inherited configuration'],(d,s)=>{
    title(d,'Python arguments and environment');
    code(d,'input',s?['import os','data_dir = os.getenv("DATA_DIR")']:['import sys','filename = sys.argv[1]'],110,235,36,81);
    text(d,'meaning',640,445,s?'Missing variable: None':'Argument 0 names the script',33,P.green);
  },'sys.argv is a list of command-line strings and index zero is the script name in the usual script invocation. The filename example assumes a first argument; validate its presence or use argparse for a real command-line tool. os.getenv reads the current process environment. A missing variable yields None unless a default is provided. DATA_DIR must be exported by the parent shell or passed in another way before launching Python. The environment is inherited configuration, not a shared live connection to the parent shell.', '33',{minutes:2,sources:[PY+'library/sys.html#sys.argv',PY+'library/os.html#os.getenv']});

  scene('Reading structured files',['CSV','JSON configuration'],(d,s)=>{
    title(d,'Reading structured files');
    code(d,'read',s?['import json','with open("config.json", encoding="utf-8") as f:','    config = json.load(f)']:['import pandas as pd','df = pd.read_csv("data.csv")'],85,210,s?30:36,75);
    text(d,'result',640,455,s?'dict or other decoded JSON value':'DataFrame',33,P.green);
  },'pandas.read_csv parses tabular data into a DataFrame. It is a third-party dependency and should be installed in the project environment. Python’s standard-library json module parses JSON. A JSON object commonly becomes a dict, but a JSON document can also have another top-level type. with closes the file when its block finishes, including on exceptions. Explicit UTF-8 makes the expected text encoding clear. Real datasets require schema, missing-value, delimiter, encoding, and type decisions. Later course material expands those formats.', '33',{minutes:2,sources:[PY+'library/json.html','https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html']});

  scene('Writing structured files',['Console','CSV','JSON configuration'],(d,s)=>{
    title(d,'Writing structured files');
    const lines=[['print("Hello!")','print("Result:", 42)'],['df.to_csv("results.csv", index=False)'],['import json','config = {"threshold": 0.8, "verbose": True}','with open("config.json", "w", encoding="utf-8") as f:','    json.dump(config, f, indent=2)']][s];
    code(d,'write',lines,80,210,s===2?28:34,s===2?67:90);
  },'print writes to stdout by default; its file argument can choose another destination. df.to_csv writes the existing DataFrame. index=False omits the DataFrame’s row index from the CSV. The source builds a small name/score DataFrame first; reuse the one loaded on the previous scene or create it during demonstration. json.dump serializes Python values and converts True to JSON true. Opening in w mode truncates an existing file. Discuss output destinations before running examples that overwrite a file.', '34',{minutes:2,sources:[PY+'library/functions.html#print',PY+'library/json.html','https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.to_csv.html']});

  scene('Python environment scope',['A Python assignment','A child process','The parent stays unchanged'],(d,s)=>{
    title(d,'Python environment scope');code(d,'assign',['os.environ["DATA_DIR"] = "/my/path"'],95,190,33);
    flow(d,['Shell','Python','Child'],Math.min(s,2),310);
    if(s>=1)d.text('child-copy',1110,470,'inherits',29,P.green);
    if(s>=2)d.text('parent-scope',200,470,'unchanged',29,P.orange);
  },'The assignment requires import os and changes the Python process environment. Children it launches afterward normally inherit that value unless given a replacement environment. It cannot mutate the parent shell’s environment. Ask whether running a Python script that sets DATA_DIR will make echo "$DATA_DIR" change back in the shell. Expected: no. This is the same process inheritance rule introduced with export in Bash. Existing sibling or child processes do not receive a retroactive update either.', '34',{minutes:2,sources:[PY+'library/os.html#os.environ']});

  scene('Python conditionals',['The score','First matching branch'],(d,s)=>{
    title(d,'Python conditionals');
    code(d,'if',['score = 85','if score >= 90:','    print("Grade: A")','elif score >= 80:','    print("Grade: B")','else:','    print("Grade: C or below")'],110,178,31,47,s?4:0);
  },'Ask students to predict the output for 85 before revealing the active branch. Python evaluates conditions in order and executes the first matching branch. For 85 the >=90 test fails and the >=80 test succeeds, so it prints Grade: B. else runs if no preceding condition is true. Indentation defines blocks; colons introduce them. Compare the structure with Bash then/else/fi. Change score to 95 and 70 orally, then ask which blocks are skipped.', '35',{activity:'control',minutes:2});

  scene('Python loops',['A range','An iterable of names'],(d,s)=>{
    title(d,'Python loops');
    code(d,'for',s?['names = ["Alice", "Bob", "Carol"]','for name in names:','    print(name)']:['for i in range(5):','    print(i)'],110,215,34,76);
    text(d,'values',640,462,s?'Alice   Bob   Carol':'0   1   2   3   4',35,P.green);
  },'A for loop consumes an iterable one item at a time. range(5) yields integers starting at zero and ending before five. The list example supplies three strings. Indentation identifies the loop body. Ask how range(1, 5) changes the output and how an empty list changes the number of iterations. An iterable is a broader concept than a list; files, ranges, and many other objects can supply items to a loop.', '36',{minutes:2});

  scene('Functions',['A reusable operation','Default argument','Explicit argument'],(d,s)=>{
    title(d,'Functions');
    code(d,'function',['def multiply(x, multiplier=2.0):','    """Return x times multiplier."""','    return x * multiplier',s===2?'multiply(20, multiplier=3)':'multiply(20)'],110,200,33,68,s?3:0);
    if(s)text(d,'result',1020,485,s===2?'60':'40.0',45,P.green);
  },'A function names a reusable operation. def introduces its name, parameters, and body. The docstring documents its purpose. return sends a result to the caller. The default multiplier is 2.0; supplying multiplier=3 overrides it. The source also defines add(x, y, z) and calls add(2, 4, 20), producing 26. Ask students to write that body in the open space. A function can have no explicit return statement, in which case it returns None. Printing a value and returning a value serve different purposes.', '37',{minutes:3});

  scene('Python exceptions',['A missing file','An invalid conversion'],(d,s)=>{
    title(d,'Python exceptions');
    code(d,'errors',s?['try:','    value = int("abc")','except ValueError:','    print("Conversion failed")']:['try:','    with open("data.txt") as f:','        content = f.read()','except FileNotFoundError:','    print("File does not exist")'],90,195,32,61,s?2:3);
  },'Ask which operation raises each exception. open raises FileNotFoundError when the path is missing. int("abc") raises ValueError because that string is not a valid integer representation. Catch the specific exception you can handle; unrelated failures should remain visible. The context manager closes the file reliably. This demonstration reports an error but does not define a complete production policy. A real command may need a diagnostic on stderr and a nonzero exit status after an unrecoverable failure.', '38',{minutes:3,sources:[PY+'tutorial/errors.html']});

  scene('Python logging',['Configuration','Severity'],(d,s)=>{
    title(d,'Python logging');
    if(!s)code(d,'logging',['import logging','logging.basicConfig(level=logging.INFO)','logging.info("Started")','logging.error("Could not read input")'],100,200,32,68);
    else ['DEBUG','INFO','WARNING','ERROR','CRITICAL'].forEach((v,i)=>{d.text('level-'+i,200+i*220,300,v,29,i<2?P.muted:i===2?P.orange:P.red);if(i<4)d.arrow('level-edge-'+i,275+i*220,300,335+i*220,300,P.line,3);});
  },'Logging supports levels, formatting, and handlers for destinations such as files or console. basicConfig(level=logging.INFO) allows INFO and higher severity messages through the default setup. Without configuration, the default threshold is WARNING and the usual default StreamHandler writes to stderr. The source says print only outputs to stdout; more precisely, print defaults to stdout and accepts a file argument. Logging severity does not itself terminate the process or set an exit status. Ask which messages a student needs while debugging versus during an unattended scheduled run.', '39',{minutes:2,sources:[PY+'howto/logging.html',PY+'library/functions.html#print']});

  scene('Python practice and discussion',['A small script','Course handoff'],(d,s)=>{
    title(d,'Python practice and discussion');
    text(d,'prompt',640,220,'Read a file. Transform a value. Report failure.',37);
    text(d,'location',640,345,'class/03-scripting/python',30,P.green);
    if(s){text(d,'lab',640,435,'Lab 02: September 16',32,P.orange);text(d,'canvas',640,500,'Canvas: Week 04 · Scripting',28,P.muted);}
  },'Use the source’s Python examples as discussion material. Ask pairs to identify input, output, one branch, and one failure path before they run a script. The supplied slides remind students that Lab 02 is due September 16 and point to Canvas > Modules > Week 04 - Scripting for resources and the next hands-on class. Preserve these as the source’s course reminders; verify the live LMS if schedules have changed. The source has no additional content on its generic Discussion cover. The next section begins the September 17 environment material.', '40–43',{kind:'activity',minutes:4,sources:['https://github.com/uvads/ds2022/tree/main/class/03-scripting/python']});

  scene('Python environments',['The second meeting','A project’s dependencies'],(d,s)=>{
    title(d,'Python environments');text(d,'date',640,200,'September 17, 2026',33,P.muted);
    flow(d,['Project','Environment','Run'],s?1:0,325);
  },'This is the natural start of the second meeting contained in the uploaded PowerPoint. Revisit questions from scripting before moving to Python packages, environment isolation, and uv. Ask students to describe what must be present besides the .py file to run a script using pandas. Expected: a suitable Python interpreter and compatible dependencies. The later practice section gives them time to apply Bash and Python together.', '44–46',{kind:'title',minutes:1});

  scene('Python packages',['Specialized tools','Dependencies'],(d,s)=>{
    title(d,'Python packages');
    if(!s)d.table('packages',170,180,[365,575],[['Package','Example use'],['pandas','data analysis'],['seaborn','visualization'],['SQLAlchemy','databases'],['PySpark','distributed processing']],{rowHeight:65,fontSize:30});
    else{flow(d,['Your code','Package','Dependency'],1,255);text(d,'versions',640,450,'Python and package versions must agree',32,P.orange);}
  },'Packages provide reusable tools beyond the standard library. The examples match the source’s categories. A package can depend on other packages, and its supported Python versions constrain the environment. Compatibility is a set of requirements, not simply “the newest version of everything.” Ask why two working projects might need different versions of the same package. The dependency diagram is schematic, not the actual dependency graph of any named package.', '47',{minutes:2});

  scene('Environment isolation',['A shared conflict','Separate projects','Reproducible setup'],(d,s)=>{
    title(d,'Environment isolation');
    box(d,'a',110,235,420,190,'Project A',true,P.blue,35);box(d,'b',750,235,420,190,'Project B',true,P.green,35);
    text(d,'v1',320,375,'package v1',31,P.blue);text(d,'v2',960,375,'package v2',31,P.green);
    if(!s){d.line('conflict-1',590,287,690,387,P.orange,6);d.line('conflict-2',690,287,590,387,P.orange,6);}
    if(s>=1)text(d,'isolate',640,484,'Separate package directories',32,P.green);
    if(s===2){d.line('lock-a',530,445,605,485,P.blue,3);d.line('lock-b',750,445,675,485,P.green,3);}
  },'Each project environment provides its own package installation location, so installing one version for Project B does not overwrite Project A’s version. This reduces clutter, eases replacement of an environment, and helps teams reproduce compatible setups. A requirements or lock file records dependency information. Isolation is not a security sandbox and does not promise identical operating systems, data, credentials, or external services. The versions shown are illustrative labels, not compatibility claims about a specific package. Use the environment activity to test incompatible requirements and isolate the projects.', '48',{activity:'environments',minutes:3});

  scene('Environment tools',['Available approaches','The course workflow'],(d,s)=>{
    title(d,'Environment tools');
    d.table('tools',150,175,[310,650],[['Tool','Role'],['venv','standard-library environments'],['Pipenv','application workflow'],['conda / mamba','Python and other packages'],['uv','Python project workflow']],{rowHeight:65,fontSize:29});
    if(s)text(d,'choice',640,510,'This course uses uv',32,P.green);
  },'Preserve the source’s options without presenting its subjective speed rankings as measurements. venv is Python’s built-in virtual environment module. Pipenv combines application dependency and environment workflows. Conda and mamba work with packages beyond Python. uv supplies a Python-focused toolchain including projects, dependency resolution, environments, and a pip-style interface. The course chooses uv for the following examples; a plain venv is still a useful conceptual foundation. Installation and platform setup belong in the course’s setup instructions.', '49',{minutes:2,sources:[PY+'library/venv.html',UV]});

  scene('A uv project',['Initialize','Add dependencies','Run'],(d,s)=>{
    title(d,'A uv project');
    code(d,'uv',['uv init --no-package my_project','cd my_project','uv add requests pandas','uv run main.py'],100,205,34,70,[0,2,3][s]);
  },'Use --no-package explicitly to make this beginner script layout independent of uv’s changing defaults. After initialization, edit main.py to contain the example script. uv add records the requested dependencies and updates the project environment and lockfile. uv run runs inside the project environment and checks its state. Current uv documentation says v0.12 changed the default uv init application layout to a packaged src/<name>/ project; earlier versions used the simpler layout. An explicit --package selects the packaged approach when desired. The displayed command is intentionally precise rather than relying on an unstated uv version.', '50, 52',{minutes:3,sources:[UV+'concepts/projects/init/',UV+'guides/projects/']});

  scene('Project files',['Source and declaration','Lock and environment'],(d,s)=>{
    title(d,'Project files');
    const rows=s?[['File','Purpose'],['uv.lock','resolved dependencies'],['.venv/','installed environment'],['.python-version','Python selection']]:[['File','Purpose'],['main.py','your script'],['pyproject.toml','project and dependencies'],['README.md','usage notes']];
    d.table('files',125,195,[485,545],rows,{rowHeight:75,fontSize:30});
    if(s)text(d,'git',640,510,'Commit source and lock. Recreate .venv.',29,P.green);
  },'For the explicit --no-package workflow, main.py lives at the project root. Initialization creates the project metadata, example script, README, and Python version file. uv creates .venv and uv.lock during project operations such as adding dependencies or running a command, rather than requiring that all of these exist immediately after init. The source’s src/my_project tree belongs to a packaged layout. Git initialization depends on context and options. Keep the environment directory out of version control; teammates recreate it from project files. The Python version file guides interpreter choice but does not install identical system libraries everywhere.', '50',{minutes:2,sources:[UV+'concepts/projects/init/',UV+'concepts/projects/layout/']});

  scene('Dependency files',['Declared requirements','Resolved dependencies'],(d,s)=>{
    title(d,'Dependency files');
    if(!s){code(d,'req',['requests>=2','pandas'],110,225,38,72);text(d,'requirement',900,330,'requirements.txt',31,P.blue);}
    else{flow(d,['Project needs','Resolver','uv.lock'],1,245);text(d,'locked',640,455,'Resolved versions and dependency relationships',31,P.green);}
  },'requirements.txt is a widely used pip input format. It can contain top-level requirements, version constraints, pinned transitive packages, hashes, and other supported directives; it is not inherently restricted to top-level dependencies. A lock file records a resolved dependency set and related metadata to make repeated installation predictable. uv.lock is maintained by uv and should be committed for a uv project. A lockfile improves reproducibility within its supported Python/platform conditions but does not freeze operating systems or external data. uv can import requirements and export locked dependencies for tools needing requirements format.', '51',{minutes:3,sources:[UV+'concepts/projects/layout/',UV+'concepts/projects/export/',UV+'concepts/projects/dependencies/']});

  scene('uv with a virtual environment',['Create and activate','Install packages'],(d,s)=>{
    title(d,'uv with a virtual environment');
    code(d,'venv',s?['uv pip install requests pandas','uv pip install -r requirements.txt']:['uv venv .venv','source .venv/bin/activate'],110,240,34,86);
  },'This is the source appendix’s lower-level environment workflow, shown separately from the uv project workflow. uv venv creates an environment without scaffolding a complete application project. The activation command shown is for Bash/Zsh on Unix-like systems; Windows activation paths and syntax differ. Once active, uv pip install can install packages or read a requirements file. These commands use uv’s pip-compatible interface; they do not imply that pip is installed in the environment. uv pip install does not automatically update a project’s pyproject.toml and uv.lock. Use uv add for project-managed dependencies.', '53',{minutes:2,sources:[UV+'pip/environments/',UV+'pip/packages/']});

  scene('Environment experiment',['Before installing','After installing','A different project'],(d,s)=>{
    title(d,'Environment experiment');
    flow(d,['Project A','Environment A','import pandas'],s===0?0:Math.min(s,2),270);
    text(d,'prompt',640,200,s===0?'Predict the result':s===1?'Add pandas to Project A':'Does Project B inherit that installation?',34);
    text(d,'inspect',640,465,'uv run python -c "import sys; print(sys.executable)"',27,P.green);
  },'During the demo, initialize a disposable project using the explicit no-package workflow. Before adding pandas, predict whether import pandas will succeed in its clean environment. Add pandas with uv add, then run the import and inspect sys.executable. Compare with a second fresh project to show that the installation is not shared automatically. Do not infer environment membership from a prompt label alone. The interactive activity models dependency isolation so students can explore while the instructor works in a real terminal.', '52',{kind:'activity',activity:'environments',minutes:5});

  scene('Course repository practice',['Inspect the checkout','Update the fork'],(d,s)=>{
    title(d,'Course repository practice');
    code(d,'git',s?['git switch main','git fetch upstream','git merge upstream/main']:['git status','git remote -v'],110,220,35,78);
    text(d,'repo',640,500,'github.com/uvads/ds2022',29,P.green);
  },'The source directs students into their own fork of the DS2022 course repository and then to class/03-scripting. Inspect git status before changing branches so current work can be saved appropriately. Confirm that upstream points to the original course repository and that main is the intended branch. git fetch retrieves upstream changes; git merge upstream/main integrates them and may require conflict resolution. The PowerPoint uses a typographic dash in git remote -v; the displayed command here uses the correct ASCII hyphen. These are learner practice instructions, not actions performed automatically by the slides.', '54–55',{kind:'activity',minutes:3,sources:['https://github.com/uvads/ds2022']});

  scene('Hands-on scripting',['Bash','Python','Compare'],(d,s)=>{
    title(d,'Hands-on scripting');
    const prompt=['Accept a filename. Check it. Log the result.','Read structured data. Transform it. Save output.','Explain one failure and its reported status.'][s];
    text(d,'prompt',640,235,prompt,34);flow(d,['Predict','Run','Explain'],s,355);
  },'Give students time with the course’s class/03-scripting exercises. Suggested Bash task: accept a filename, test for a regular file, and report a useful success or failure message. Suggested Python task: load a small CSV or JSON file, transform one value under an explicit rule, and save the result. Require one deliberate failure case for each script. Have partners predict output and status before running, then explain the observed result. The practice prompts summarize the source’s hands-on handoff without inventing the contents of the externally maintained exercises.', '54–55',{kind:'activity',minutes:10,sources:['https://github.com/uvads/ds2022/tree/main/class/03-scripting']});

  scene('Scripting handoff',['Assignment','Exit question'],(d,s)=>{
    title(d,'Scripting handoff');
    text(d,'lab',640,230,'Lab 03 · Scripting',46,P.green);text(d,'due',640,320,'Due September 23',35,P.orange);
    if(s)text(d,'question',640,465,'What must travel with your script?',37);
  },'The supplied PowerPoint lists Lab 03 – Scripting as due September 23. Direct students to Canvas and the course repository for the current assignment details. Close by asking what another person needs to run their script: source code, input expectations, interpreter, dependencies, configuration, and useful instructions. The source’s final “Next Class” slide has no additional topic, so no future lesson has been invented here. Keep a learner’s answer in the handwriting space as a bridge to the next meeting.', '56–57',{kind:'recap',minutes:2});

  window.COURSE_DECKS = window.COURSE_DECKS || {};
  window.COURSE_DECKS[4] = {id:4,title:'Scripting',date:'September 15 & 17, 2026',source:'lectures/lecture-04/index.html',scenes};
})();
