import {SAMPLE_DATA,pipeline,commandLookup,inheritVariable,STREAM_MODES,routeStreams,controlTrace,ENV_PROJECTS,createEnvironmentState,protobufCompatibility,environmentState,installEnvironment} from './models.mjs?v=20260917-venv-intro';
import {createVirtualEnvironmentDemo,renderVirtualEnvironment} from './venv-lab.mjs?v=20260917-venv-intro';

const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shellQuote = value => `'${String(value).replace(/'/g, `'"'"'`)}'`;
const activities = [
  {id:'pipeline',number:'01',name:'Build a pipeline',short:'Pipelines',description:'Clean messy data. Watch each transformation change the next step.',prompt:'Turn off normalization, then turn it back on. Why does duplicate removal change?',tiles:['raw data','clean','load'],source:'Slides 4–6'},
  {id:'path',number:'02',name:'Follow the PATH',short:'PATH & export',description:'Choose which program runs, then see what a child process inherits.',prompt:'Move /usr/bin above /usr/local/bin. Which Python runs? Does exporting PET change PATH?',tiles:['shell','PATH','process'],source:'Slides 9, 13–16'},
  {id:'streams',number:'03',name:'Route the output',short:'Streams',description:'Send stdout and stderr to a terminal, a file, or the next command.',prompt:'Run append twice, then replace once. Next, pipe stdout: where does the warning go?',tiles:['stdout','→','file / pipe'],source:'Slides 4, 20, 34, 39'},
  {id:'control',number:'04',name:'Step through logic',short:'Control flow',description:'Follow a branch, walk a loop, and predict what runs after a failure.',prompt:'Choose short circuits. Give check_data a nonzero status. Compare &&, ||, and ; before stepping.',tiles:['test','branch','result'],source:'Slides 21–28, 35–36'},
  {id:'venv',number:'05',name:'Build a virtual environment',short:'Virtual environments',description:'See what .venv contains, create one with uv, and discover which Python can use its packages.',prompt:'Create the environment before installing requests. Which interpreter can import it? In the environment-only workflow, activate and deactivate the terminal. Do the packages disappear?',tiles:['Python','.venv','your code'],source:'Slides 47–53'},
  {id:'environments',number:'06',name:'Resolve a dependency conflict',short:'Dependency conflicts',description:'Two setups, two terminals. See why dbt and Pub/Sub need separate project environments.',prompt:'Run Setup 1, then try adding Pub/Sub there. Why does the add fail while Setup 2 succeeds? Test a shared protobuf version, then rebuild either project from its lock.',tiles:['dbt-core','protobuf','Pub/Sub'],source:'Slides 47–53'}
];
const initial = {
  pipeline:()=>({raw:SAMPLE_DATA,normalize:true,validate:true,unique:true,filter:false,minimum:80}),
  path:()=>({command:'python',pet:'Rhesus monkey',exported:false,directories:[
    {path:'/home/student/scripts',commands:{python:{executable:false,version:'Python 3.12 (custom)'},'greetings.sh':{executable:true,version:'Course greeting script'}}},
    {path:'/usr/local/bin',commands:{python:{executable:true,version:'Python 3.13 (local)'},'greetings.sh':{executable:false,version:'Local greeting script'}}},
    {path:'/usr/bin',commands:{python:{executable:true,version:'Python 3.11 (system)'},'greetings.sh':{executable:false,version:'System greeting script'}}}
  ]}),
  streams:()=>({mode:'replace',file:'earlier run\n',stdout:'Ada,91\nBob,82\n',stderr:'warning: Ada has a missing field\n',pattern:'Ada',runs:0,result:null}),
  control:()=>({mode:'branch',exists:true,names:'Ada, Bob, Cara',operator:'&&',first:0,second:0,step:0}),
  environments:()=>createEnvironmentDemo(),
  venv:()=>createVirtualEnvironmentDemo()
};
const states = Object.fromEntries(Object.entries(initial).map(([key,fn])=>[key,fn()]));
let current = new URLSearchParams(location.search).get('activity');
if (!activities.some(activity => activity.id === current)) current = null;
let toastTimer;
function notify(message) { $('#toast').textContent = message; clearTimeout(toastTimer); toastTimer = setTimeout(()=>{$('#toast').textContent='';},4000); }
function setResult(html) {
  const focused = document.activeElement?.id;
  $('#results').innerHTML = html;
  if (focused) document.getElementById(focused)?.focus({preventScroll:true});
}
function card(activity) {
  return `<a class="activity-card" href="?activity=${activity.id}"><span class="number">${activity.number} / ${activity.source}</span><div class="mini" aria-hidden="true">${activity.tiles.map((tile,index)=>`${index ? '<span class="arrow">→</span>' : ''}<span class="tile ${index===1?'orange':index===2?'blue':''}">${tile}</span>`).join('')}</div><h2>${activity.name}</h2><p>${activity.description}</p><span class="card-link">Open interactive<span>↗</span></span></a>`;
}
function gallery() {
  document.title = 'Lecture 04 · Interactive scripting lab';
  $('#main').innerHTML = `<section class="gallery-header"><div><p class="eyebrow">Lecture 04 / Student playground</p><h1>See the script.<br>Change what happens.</h1><p class="intro">Six small experiments for Bash, Python, and the ideas connecting them. Open one, make a prediction, then change the inputs.</p></div><div class="stamp">Made for class.<br>Ready to explore.<br>Each activity has its own link.</div></section><div class="gallery">${activities.map(card).join('')}</div><p class="section-note">These models run locally in this browser. They do not execute shell commands or install packages.</p>`;
}
function activityPage() {
  if (!current) return gallery();
  const activity = activities.find(item=>item.id===current);
  document.title = `${activity.short} · Lecture 04 interactive lab`;
  $('#main').innerHTML = `<a class="back" href="index.html">← All interactives</a><div class="activity-heading"><div><p class="eyebrow" style="margin-top:26px;margin-bottom:8px">${activity.number} / ${activity.source} / Classroom simulation</p><h1>${activity.name}</h1><p class="intro">${activity.description}</p></div><div class="heading-tools"><button id="reset">Reset activity</button><button id="copy-link">Copy activity link</button></div></div><nav class="activity-tabs" aria-label="Activities">${activities.map(item=>`<a href="?activity=${item.id}" ${item.id===current?'aria-current="page"':''}>${item.short}</a>`).join('')}</nav><div class="workspace"><section class="panel" id="controls" aria-label="Activity controls"></section><div class="result-column" id="results" aria-label="Simulation results" aria-live="polite" aria-atomic="false"></div></div><aside class="prompt"><strong>Try this</strong>${activity.prompt}</aside>`;
  $('#reset').addEventListener('click',()=>{states[current]=initial[current]();renderers[current]();notify('Activity reset.');});
  $('#copy-link').addEventListener('click',async()=>{
    const url = new URL('index.html',location.href);url.searchParams.set('activity',current);
    try {await navigator.clipboard.writeText(url.href);notify('Direct activity link copied.');}
    catch { const field=document.createElement('input');field.value=url.href;field.setAttribute('aria-label','Activity link — select and copy');field.style.width='100%';$('#controls').prepend(field);field.focus();field.select();notify('Select and copy the link shown in the controls.'); }
  });
  renderers[current]();
}
function emptyOutput(text) {return text ? esc(text) : '<span class="muted">(no output)</span>';}
function sourceLink(url,label) {return `<p class="source-link">Reference: <a href="${url}" target="_blank" rel="noopener">${label} ↗</a></p>`;}
function readBool(id) {return document.getElementById(id).checked;}

function renderPipeline() {
  const state=states.pipeline;
  $('#controls').innerHTML=`<h2>Choose the transformations</h2><label class="field"><span>Synthetic records</span><textarea id="raw-data" rows="8" spellcheck="false" maxlength="15000">${esc(state.raw)}</textarea><small>One <code>name,score</code> pair per line. No header or quoted commas in this small model.</small></label><label class="check"><input id="normalize" type="checkbox" ${state.normalize?'checked':''}>Trim fields & lowercase names</label><label class="check"><input id="validate" type="checkbox" ${state.validate?'checked':''}>Require a name and score 0–100</label><label class="check"><input id="unique" type="checkbox" ${state.unique?'checked':''}>Remove exact duplicate pairs</label><hr class="control-divider"><label class="check"><input id="filter" type="checkbox" ${state.filter?'checked':''}>Keep scores at or above a minimum</label><label class="field"><span>Minimum score <output id="minimum-label">${state.minimum}</output></span><input type="range" id="minimum" min="0" max="100" value="${state.minimum}"></label><p class="section-note">The pipeline updates as you edit. Each stage receives the previous stage’s output.</p>`;
  $('#controls').oninput=pipelineInput;
  updatePipeline();
}
function pipelineInput() {
  const state=states.pipeline;
  state.raw=$('#raw-data').value;
  for(const key of ['normalize','validate','unique','filter']) state[key]=readBool(key);
  state.minimum=Number($('#minimum').value);$('#minimum-label').textContent=state.minimum;
  updatePipeline();
}
function updatePipeline() {
  const state=states.pipeline,result=pipeline(state.raw,state),names=['Extract','Normalize','Validate','Dedupe','Filter'],enabled=[true,state.normalize,state.validate,state.unique,state.filter];
  setResult(`<section class="panel"><div class="panel-head"><h2>Data in motion</h2><span class="badge">Live model</span></div><div class="flow" aria-label="Record counts at each stage">${result.stages.map((rows,index)=>`${index?'<span class="flow-arrow" aria-hidden="true">→</span>':''}<div class="flow-node ${enabled[index]?'active':'off'}">${names[index]}<strong>${rows.length}</strong><span class="sub">${enabled[index]?'records':'bypassed'}</span></div>`).join('')}</div><div class="metrics"><span><strong>${result.stages[0].length}</strong> input records</span><span><strong>${result.removed}</strong> removed</span><span><strong>${result.rows.length}</strong> ready to load</span></div><p class="hint">A disabled step passes every record through unchanged. Duplicate removal compares the name and score text after any normalization.</p></section><section class="panel"><div class="panel-head"><h2>Final output</h2><span class="badge">${result.rows.length} rows</span></div>${result.rows.length?`<div class="table-wrap"><table><thead><tr><th scope="col">Name</th><th scope="col">Score</th><th scope="col">Input row</th></tr></thead><tbody>${result.rows.map(row=>`<tr><td>${esc(row.name)||'∅'}</td><td>${esc(row.score)||'∅'}</td><td>${row.id}</td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">No records remain. Change the input or relax a filter.</p>'}<details style="margin-top:18px"><summary class="hint">View output text</summary><pre style="margin-top:12px">${esc(result.text)||'(empty)'}</pre></details></section><div class="terminal"><div class="label">Conceptual pipeline</div><pre>extract${state.normalize?' | normalize':''}${state.validate?' | validate':''}${state.unique?' | deduplicate':''}${state.filter?` | filter_minimum ${state.minimum}`:''} &gt; cleaned.csv</pre><p class="hint" style="color:#afc2b4;margin-bottom:0">Stage names illustrate small programs; they are not built-in shell commands.</p></div>`);
}

function renderPath() {
  const state=states.path;
  $('#controls').innerHTML=`<h2>Search & inheritance</h2><label class="field"><span>External command</span><select id="command"><option value="python" ${state.command==='python'?'selected':''}>python</option><option value="greetings.sh" ${state.command==='greetings.sh'?'selected':''}>greetings.sh</option></select><small>Move folders with ↑ / ↓. Toggle “executable” to add or remove a runnable match.</small></label><hr class="control-divider"><label class="field"><span>Parent shell variable PET</span><input id="pet" maxlength="80" value="${esc(state.pet)}"></label><label class="check"><input id="exported" type="checkbox" ${state.exported?'checked':''}>Export PET to new child processes</label><p class="section-note">Assume a fresh external-command lookup: no aliases, functions, builtins, or cached command paths. The locations and Python installations are examples.</p>`;
  $('#controls').oninput=()=>{state.command=$('#command').value;state.pet=$('#pet').value;state.exported=readBool('exported');updatePath();};
  $('#results').onclick=event=>{
    const button=event.target.closest('[data-move]');
    if(!button)return;
    const index=Number(button.dataset.index),next=index+Number(button.dataset.move);
    [state.directories[index],state.directories[next]]=[state.directories[next],state.directories[index]];updatePath();
  };
  $('#results').onchange=event=>{
    if(!event.target.matches('[data-executable]'))return;
    state.directories[Number(event.target.dataset.executable)].commands[state.command].executable=event.target.checked;updatePath();
  };
  updatePath();
}
function updatePath() {
  const state=states.path,result=commandLookup(state.directories,state.command),env=inheritVariable(state.pet,state.exported);
  setResult(`<section class="panel"><div class="panel-head"><h2>First executable match wins</h2><span class="badge ${result.found<0?'error':''}">${result.found<0?'No match':'Found'}</span></div><ol class="dir-list">${state.directories.map((dir,index)=>`<li class="directory ${result.found===index?'selected':result.found>=0&&index>result.found?'unvisited':''}"><span class="dir-rank">${index+1}</span><div class="dir-info"><div class="dir-name">${esc(dir.path)}</div><div class="dir-status">${result.searched[index].state}${result.found===index?` · ${esc(result.version)}`:''}</div></div><div class="dir-actions"><button id="up-${index}" data-move="-1" data-index="${index}" aria-label="Move ${esc(dir.path)} earlier" ${index===0?'disabled':''}>↑</button><button id="down-${index}" data-move="1" data-index="${index}" aria-label="Move ${esc(dir.path)} later" ${index===state.directories.length-1?'disabled':''}>↓</button><label><input type="checkbox" id="executable-${index}" data-executable="${index}" ${dir.commands[state.command].executable?'checked':''} aria-label="${esc(state.command)} is executable in ${esc(dir.path)}"><span class="small-label">executable</span></label></div></li>`).join('')}</ol><pre class="path-string">PATH=${esc(state.directories.map(dir=>dir.path).join(':'))}</pre><div class="terminal"><div class="label">Lookup result</div><pre>${result.path?`${esc(state.command)} → ${esc(result.path)}\n${esc(result.version)}`:`${esc(state.command)}: command not found\nExit status: 127`}</pre></div><p class="hint">Only the ordering above controls this search. A name containing “/”, such as ./greetings.sh, names a path directly instead.</p>${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Command-Search-and-Execution.html','Bash: command search')}</section><section class="panel"><h2>What crosses the process boundary?</h2><div class="split"><div class="process-box"><h3>Parent shell</h3><pre>${state.exported?'export ':''}PET=${esc(shellQuote(state.pet))}</pre></div><div class="process-box"><h3>New child process</h3><pre>${env.child===null?'PET is unset':`PET=${esc(shellQuote(env.child))}`}</pre></div></div><div class="process-arrow">${state.exported?'PET is included in the child’s environment →':'PET stays in the parent shell · not inherited'}</div><div class="terminal"><div class="label">Child: echo "My favorite animal: $PET!"</div><pre>${esc(env.childOutput)}</pre></div><p class="hint">This child uses normal Bash expansion, without <code>set -u</code>. Each change models a newly launched child. Exporting PET does not change PATH.</p>${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Environment.html','Bash: environment')}</section>`);
}

function renderStreams() {
  const state=states.streams;
  $('#controls').innerHTML=`<h2>Choose the route</h2><label class="field"><span>Redirection / pipe</span><select id="stream-mode">${Object.entries(STREAM_MODES).map(([key,mode])=>`<option value="${key}" ${state.mode===key?'selected':''}>${esc(mode.label)}</option>`).join('')}</select></label><label class="field"><span>stdout · file descriptor 1</span><textarea id="stdout" rows="3" maxlength="3000" spellcheck="false">${esc(state.stdout)}</textarea></label><label class="field"><span>stderr · file descriptor 2</span><textarea id="stderr" rows="3" maxlength="3000" spellcheck="false">${esc(state.stderr)}</textarea></label><label class="field"><span>Pipe: literal text to keep</span><input id="pattern" value="${esc(state.pattern)}" maxlength="60"><small><code>grep -F</code> keeps matching lines. Case sensitive; an empty pattern matches every line.</small></label><button class="primary" id="run-stream">Run simulation</button><p class="section-note">Each run writes to the current virtual file. Reset restores “earlier run”. Text above is emitted exactly as entered: stdout first, then stderr.</p>`;
  $('#controls').oninput=()=>{state.mode=$('#stream-mode').value;state.stdout=$('#stdout').value;state.stderr=$('#stderr').value;state.pattern=$('#pattern').value;state.result=null;updateStreams();};
  $('#run-stream').onclick=()=>{state.result=routeStreams(state);state.file=state.result.file;state.runs+=1;updateStreams();notify(`Simulation run ${state.runs} complete.`);};
  updateStreams();
}
function updateStreams() {
  const state=states.streams,mode=STREAM_MODES[state.mode],result=state.result,preview=routeStreams(state),destination={terminal:'terminal',file:'out.txt',errors:'errors.txt',discard:'/dev/null',pipe:'grep -F → terminal'};
  const suffix=mode.suffix.replace('PATTERN',shellQuote(state.pattern));
  setResult(`<div class="terminal"><div class="label">Simulated command</div><pre>produce${esc(suffix)}</pre></div><section class="panel"><div class="panel-head"><h2>Two independent streams</h2><span class="badge">${result?'Last run':'Route preview'}</span></div><div class="route-grid"><div class="stream-node">stdout <small>Data · descriptor 1</small></div><div class="route-arrow" aria-hidden="true">→</div><div class="stream-destination">${destination[preview.routes.stdout]}</div><div class="stream-node stderr">stderr <small>Diagnostics · descriptor 2</small></div><div class="route-arrow" aria-hidden="true">→</div><div class="stream-destination">${destination[preview.routes.stderr]}</div></div><p class="hint">${state.mode==='order'?'Redirections are applied left to right. Here 2>&1 copies stdout’s terminal destination before stdout is sent to the file.':state.mode==='combined'?'First stdout is opened on the file; then 2>&1 copies that destination for stderr.':preview.piped?'The pipe initially connects stdout to the next command. stderr joins it only when explicitly redirected.':'A plain > or >> applies to stdout. stderr keeps its terminal destination unless redirected.'}</p></section><section class="panel"><div class="panel-head"><h2>Inspect the result</h2><span class="badge">${state.runs} run${state.runs===1?'':'s'}</span></div>${!result?'<p class="hint" style="margin-top:0;margin-bottom:17px">Press Run simulation to send the text through this route. Previous terminal output is cleared when inputs change; out.txt persists.</p>':''}<div class="split"><div class="output-block"><h3>TERMINAL ${result?'· LAST RUN':''}</h3><pre>${result?esc(result.terminal)||'(no output)':'(waiting for a run)'}</pre></div><div class="output-block"><h3>OUT.TXT · PERSISTENT FILE</h3><pre>${esc(state.file)||'(empty file)'}</pre></div>${state.mode==='errors'?`<div class="output-block"><h3>ERRORS.TXT · LAST RUN</h3><pre>${result?esc(result.errors)||'(empty)':'(waiting for a run)'}</pre></div>`:''}${preview.piped?`<div class="output-block"><h3>PIPE INPUT · STDIN OF GREP</h3><pre>${result?esc(result.pipe)||'(empty)':'(waiting for a run)'}</pre></div><div class="output-block"><h3>GREP OUTPUT ${result?`· EXIT ${result.filterStatus}`:''}</h3><pre>${result?esc(result.filtered)||'(no matching lines)':'(waiting for a run)'}</pre></div>`:''}</div><p class="hint">${state.mode==='replace'||state.mode==='combined'||state.mode==='order'?'Opening out.txt with > truncates it before produce writes, even if stdout is empty.':state.mode==='append'?'Opening out.txt with >> keeps the existing bytes and adds new output at the end.':state.mode==='discard'?'stdout is discarded. The stderr warning still appears in the terminal.':'produce is a fictional, synchronous teaching command. Real programs may buffer streams, so combined display order can vary.'}</p>${sourceLink('https://www.gnu.org/s/bash/manual/html_node/Redirections.html','Bash: redirections')}${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Pipelines.html','Bash: pipelines')}</section>`);
}

function renderControl() {
  const state=states.control;
  $('#controls').innerHTML=`<h2>Make a prediction</h2><label class="field"><span>Control structure</span><select id="control-mode"><option value="branch" ${state.mode==='branch'?'selected':''}>if / then / else</option><option value="loop" ${state.mode==='loop'?'selected':''}>for loop</option><option value="chain" ${state.mode==='chain'?'selected':''}>Short circuits: && / || / ;</option></select></label>${state.mode==='branch'?`<label class="check"><input type="checkbox" id="file-exists" ${state.exists?'checked':''}>data.txt is a regular file</label>`:state.mode==='loop'?`<label class="field"><span>Names to loop over</span><input id="names" value="${esc(state.names)}" maxlength="180"><small>Separate names with commas. Spaces inside a name stay together. Empty input creates an empty array.</small></label>`:`<label class="field"><span>Operator between commands</span><select id="operator"><option ${state.operator==='&&'?'selected':''} value="&&">&& · if first succeeds</option><option ${state.operator==='||'?'selected':''} value="||">|| · if first fails</option><option ${state.operator===';'?'selected':''} value=";">; · always run second</option></select></label><label class="field"><span>check_data exit status</span><select id="first-status">${[0,1,2].map(value=>`<option value="${value}" ${state.first===value?'selected':''}>${value} · ${value===0?'success':'failure'}</option>`).join('')}</select></label><label class="field"><span>load_data exit status</span><select id="second-status">${[0,1,2].map(value=>`<option value="${value}" ${state.second===value?'selected':''}>${value} · ${value===0?'success':'failure'}</option>`).join('')}</select></label>`}<div class="run-row"><button class="primary" id="step">Step →</button><button id="run-all">Run to end</button><button id="restart">Restart trace</button></div><p class="section-note">Inputs restart the trace. Commands shown here are simulations; the two short-circuit commands return the statuses you select.</p>`;
  $('#control-mode').onchange=()=>{state.mode=$('#control-mode').value;state.step=0;renderControl();};
  $('#controls').oninput=event=>{
    if(event.target.id==='control-mode')return;
    if(state.mode==='branch')state.exists=readBool('file-exists');
    else if(state.mode==='loop')state.names=$('#names').value;
    else {state.operator=$('#operator').value;state.first=Number($('#first-status').value);state.second=Number($('#second-status').value);}
    state.step=0;updateControl();
  };
  $('#step').onclick=()=>{state.step=Math.min(getTrace().length,state.step+1);updateControl();};
  $('#run-all').onclick=()=>{state.step=getTrace().length;updateControl();};
  $('#restart').onclick=()=>{state.step=0;updateControl();};
  updateControl();
}
function getNames(){return states.control.names.split(',').map(name=>name.trim()).filter(Boolean);}
function getTrace(){return controlTrace({...states.control,names:getNames()});}
function updateControl() {
  const state=states.control,trace=getTrace(),seen=trace.slice(0,state.step),active=seen.at(-1),cls=node=>active?.node===node?'active':'',names=getNames();
  let diagram,lines;
  if(state.mode==='branch'){
    lines=['if [[ -f "data.txt" ]]; then','    echo "File exists"','else','    echo "File does not exist"','fi'];
    diagram=`<div class="branch-rows"><div class="flow-node ${cls('test')}">Is data.txt a regular file?<strong>${state.exists?'true':'false'}</strong></div><div class="branch-choices"><div><small>↓ true · status 0</small><div class="flow-node ${cls('true')}">echo "File exists"</div></div><div><small>↓ false · status 1</small><div class="flow-node ${cls('false')}">echo "File does not exist"</div></div></div><span class="flow-arrow">↓</span><div class="flow-node ${cls('done')}">Continue after fi</div></div>`;
  }else if(state.mode==='loop'){
    lines=[`names=(${names.map(shellQuote).join(' ')})`,'for name in "${names[@]}"; do','    echo "Name: $name"','done'];
    diagram=`<div class="loop-items">${names.length?names.map((name,index)=>`<span class="${active?.item===index?'active':''}">${esc(name)}</span>`).join(''):'<span>empty array</span>'}</div><div class="flow"><div class="flow-node ${cls('item')}">Take next item<strong>${active?.item!==undefined?active.item+1:'—'}</strong></div><span class="flow-arrow">→</span><div class="flow-node ${cls('body')}">Run body<strong>echo</strong></div><span class="flow-arrow">↻</span><div class="flow-node ${cls('done')}">No items left<strong>done</strong></div></div>`;
  }else{
    lines=[`check_data ${state.operator} load_data`,'echo $?'];
    const runs=state.operator===';'||(state.operator==='&&'?state.first===0:state.first!==0);
    diagram=`<div class="flow"><div class="flow-node ${cls('first')}">check_data<strong>${state.first}</strong><span class="sub">exit status</span></div><span class="flow-arrow">→</span><div class="flow-node ${cls('gate')}">Rule<strong>${esc(state.operator)}</strong></div><span class="flow-arrow">→</span><div class="flow-node ${cls('second')} ${state.step>=2&&!runs?'off':''}">load_data<strong>${state.step>=2&&!runs?'skip':state.second}</strong><span class="sub">${state.step>=2&&!runs?'not executed':'selected exit status'}</span></div><span class="flow-arrow">→</span><div class="flow-node ${cls('done')}">echo $?<strong>${state.step===trace.length?runs?state.second:state.first:'?'}</strong><span class="sub">list status printed</span></div></div><p class="hint">0 means success. Any nonzero status means failure for these operators. A command list keeps the status of its last executed command; echo then prints that value.</p>`;
  }
  setResult(`<section class="panel"><div class="panel-head"><h2>Follow the active step</h2><span class="badge">Step ${state.step} / ${trace.length}</span></div>${diagram}</section><div class="terminal"><div class="label">Bash · simulated execution</div><ol class="code-lines">${lines.map((line,index)=>`<li class="${active?.line===index?'active':''}">${esc(line)}</li>`).join('')}</ol></div><section class="panel"><div class="split"><div><h3>Execution trace</h3>${seen.length?`<ol class="trace">${seen.map((step,index)=>`<li class="${index===seen.length-1?'current':''}"><span class="trace-index">${index+1}</span><span>${esc(step.label)}</span></li>`).join('')}</ol>`:'<p class="empty">Predict the route. Then press Step.</p>'}</div><div class="output-block"><h3>STDOUT · SO FAR</h3><pre>${esc(seen.map(step=>step.output).join(''))||'(no output yet)'}</pre></div></div>${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Lists.html','Bash: command lists')}</section>`);
  $('#step').disabled=state.step===trace.length;$('#run-all').disabled=state.step===trace.length;$('#restart').disabled=state.step===0;
}

function setupTranscript(project) {
  const spec=ENV_PROJECTS[project];
  return [
    {kind:'command',text:`$ uv init --no-package --python 3.11 ${spec.directory}\n$ cd ${spec.directory}\n$ uv add ${spec.spec}`},
    {kind:'output',text:`Selected packages in this simulation:\n${spec.spec}\nprotobuf==${spec.protobufVersion}`}
  ];
}
function conflictAttempt(env) {
  const shared={...createEnvironmentState(),installed:{shared:env.installed.a,a:null,b:null},locks:{shared:env.locks.a,a:null,b:null}};
  return installEnvironment(shared,'b');
}
function conflictTranscript(error) {
  return [
    {kind:'command',text:`$ uv add ${ENV_PROJECTS.b.spec}`},
    {kind:'error',text:`No solution found (simulated summary)\n\n${ENV_PROJECTS.a.spec}\n  requires protobuf ${ENV_PROJECTS.a.protobufRange}\n${ENV_PROJECTS.b.spec}\n  requires protobuf ${ENV_PROJECTS.b.protobufRange}\n\n${error?'These ranges do not overlap.\nInstalled packages and uv.lock are unchanged.':'No conflict reported.'}`}
  ];
}
function createEnvironmentDemo() {
  let env={...createEnvironmentState(),isolated:true};
  env=installEnvironment(env,'a').state;
  env=installEnvironment(env,'b').state;
  const conflict=conflictAttempt(env);
  return {env,candidate:'4.25.8',logs:{a:[...setupTranscript('a'),...conflictTranscript(conflict.error)],b:setupTranscript('b')},conflict:true,message:'Setup 1 rejected the incompatible add. Setup 2 succeeds in its own environment.'};
}
function renderEnvironments() {
  const state=states.environments;
  $('#controls').innerHTML=`<h2>Try one shared version</h2><label class="field"><span>Candidate protobuf version</span><select id="protobuf-version">${['4.25.8','5.29.5','6.33.4','6.33.5','7.0.0','8.0.0'].map(version=>`<option value="${version}" ${state.candidate===version?'selected':''}>${version}</option>`).join('')}</select><small>Test the version ranges. This does not change either installed environment.</small></label><div id="protobuf-check"></div><hr class="control-divider"><h3>The shared dependency</h3><p class="hint"><code>dbt-core</code> and <code>google-cloud-pubsub</code> both need <code>protobuf</code>. Neither depends on the other.</p><p class="hint">No version can satisfy both ranges. Separate projects can choose different versions.</p><p class="section-note">Browser simulation using the README’s real package requirements. It installs nothing. Terminal output is a simplified transcript; the protobuf versions shown are fixed examples, not predictions of today’s uv resolution.</p>${sourceLink('https://github.com/ksiller/DS2022/blob/main/class/03-scripting/README.md#why-isolate-environments','Course README: the conflict example')}`;
  $('#controls').oninput=()=>{state.candidate=$('#protobuf-version').value;updateVersionCheck();};
  $('#results').onclick=event=>{
    const button=event.target.closest('[data-env-action]');if(!button)return;
    const project=button.dataset.project,action=button.dataset.envAction;
    if(action==='conflict'){
      const attempt=conflictAttempt(state.env);
      state.logs.a=[...setupTranscript('a'),...conflictTranscript(attempt.error)];
      state.conflict=Boolean(attempt.error);
      state.message='No shared protobuf version exists. The failed add leaves Setup 1 and Setup 2 unchanged.';
    }else if(action==='setup'){
      const next=installEnvironment(state.env,project);
      if(next.error){state.message=next.error;}
      else{
        state.env=next.state;state.logs[project]=setupTranscript(project);
        if(project==='a')state.conflict=false;
        state.message=`${ENV_PROJECTS[project].name} is ready. Its own .venv and uv.lock keep the other setup unchanged.`;
      }
    }else if(action==='sync'){
      const empty={...state.env,installed:{...state.env.installed,[project]:null}};
      const next=installEnvironment(empty,project,{locked:true});
      if(next.error){state.message=next.error;}
      else{
        state.env=next.state;
        const spec=ENV_PROJECTS[project],actual=state.env.installed[project];
        state.logs[project]=[...state.logs[project],{kind:'command',text:'$ uv sync --locked'},{kind:'output',text:`Rebuilt .venv from this project’s lock:\n${spec.package}==${actual[spec.package]}\nprotobuf==${actual.protobuf}`}];
        if(project==='a')state.conflict=false;
        state.message=`${spec.name}: recreated .venv with the saved versions. The other environment is unchanged.`;
      }
    }
    updateEnvironments();
  };
  updateEnvironments();
}
function updateVersionCheck() {
  const state=states.environments,compatible=protobufCompatibility(state.candidate);
  $('#protobuf-check').innerHTML=`<div class="version-check" role="status">${['a','b'].map(project=>`<div class="version-result ${compatible[project]?'matches':'mismatch'}"><strong>${project==='a'?'Setup 1 · dbt':'Setup 2 · Pub/Sub'}</strong><code>${esc(ENV_PROJECTS[project].protobufRange)}</code><span>${compatible[project]?'✓ Fits this range':'× Outside this range'}</span></div>`).join('')}<p class="hint">A shared version must satisfy both ranges.</p></div>`;
}
function updateEnvironments() {
  const state=states.environments,projects=environmentState(state.env);
  setResult(`<div class="message" role="status">${esc(state.message)}</div><div class="setup-terminals">${projects.map(project=>{
    const id=project.project,spec=ENV_PROJECTS[id],conflicted=id==='a'&&state.conflict;
    return `<section class="terminal setup-terminal" aria-labelledby="setup-title-${id}"><div class="setup-terminal-header"><div><div class="label">${esc(spec.directory)} / .venv</div><h2 id="setup-title-${id}">Setup ${id==='a'?'1 · dbt':'2 · Pub/Sub'}</h2></div><span class="badge ${conflicted?'error':''}">${conflicted?'Conflict rejected':'Ready'}</span></div><div class="terminal-transcript" tabindex="0" aria-label="Setup ${id==='a'?'1':'2'} simulated terminal output">${state.logs[id].map(entry=>`<pre class="terminal-${entry.kind}">${esc(entry.text)}</pre>`).join('')}</div><div class="run-row"><button id="setup-${id}" data-env-action="setup" data-project="${id}">Run setup ${id==='a'?'1':'2'}</button>${id==='a'?'<button id="try-conflict" data-env-action="conflict" data-project="a">Try adding Pub/Sub here</button>':''}<button id="sync-${id}" data-env-action="sync" data-project="${id}">Rebuild from lock</button></div></section>`;
  }).join('')}</div><section class="panel"><div class="panel-head"><h2>Each setup keeps its own packages</h2><span class="badge">${projects.filter(project=>project.ok).length} / 2 ready</span></div><div class="split">${projects.map(project=>{
    const id=project.project,spec=ENV_PROJECTS[id];
    return `<div class="env-project"><h3>${esc(spec.directory)}</h3><p>Requires <code>${esc(spec.spec)}</code><br><code>protobuf ${esc(spec.protobufRange)}</code></p><div class="package-box"><h3>${esc(spec.directory)}/.venv</h3><pre>${esc(spec.spec)}\nprotobuf==${esc(project.actual.protobuf)}</pre></div><div class="lock-card"><strong>uv.lock</strong> keeps this setup’s resolved versions.<br><code>protobuf==${esc(state.env.locks[id].protobuf)}</code></div></div>`;
  }).join('')}</div><p class="hint">The rejected add did not replace Setup 1’s packages. Moving Pub/Sub to project-2 lets each project satisfy its own protobuf requirement. Two terminal windows alone do not isolate packages; the separate project environments do.</p></section><section class="panel"><h2>What the lock preserves</h2><p class="hint">Each successful <code>uv add</code> resolves the project, updates <code>uv.lock</code>, and installs into its <code>.venv</code>. “Rebuild from lock” simulates an absent .venv, then uses <code>uv sync --locked</code> to restore the saved package versions.</p><p class="hint">This activity focuses on the protobuf conflict. Real resolution also considers other dependencies, Python versions, and your platform. The command examples select Python 3.11; installing a project is not simulated as silently overwriting an incompatible requirement.</p>${sourceLink('https://docs.astral.sh/uv/concepts/projects/sync/','uv: locking and syncing')}${sourceLink('https://pypi.org/project/dbt-core/1.7.14/','dbt-core 1.7.14')}${sourceLink('https://pypi.org/project/google-cloud-pubsub/2.40.0/','google-cloud-pubsub 2.40.0')}</section>`);
  updateVersionCheck();
}
const renderers={pipeline:renderPipeline,path:renderPath,streams:renderStreams,control:renderControl,environments:renderEnvironments,venv:()=>renderVirtualEnvironment({state:states.venv,controls:$('#controls'),results:$('#results'),setResult})};
activityPage();
