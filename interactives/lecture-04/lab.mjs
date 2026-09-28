import {SAMPLE_DATA,pipeline,commandLookup,inheritVariable,STREAM_MODES,routeStreams,controlTrace,resolvePackages,environmentState,installEnvironment} from './models.mjs?v=20260917-dependency-restore';
import {createVirtualEnvironmentDemo,renderVirtualEnvironment} from './venv-lab.mjs?v=20260929-guided';

const $ = selector => document.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const shellQuote = value => `'${String(value).replace(/'/g, `'"'"'`)}'`;
const activities = [
  {id:'pipeline',number:'01',name:'Build a pipeline',short:'Pipelines',description:'Clean messy data. Watch each transformation change the next step.',prompt:'Turn cleaning off, then on. Why does the final row count change?',tiles:['raw data','clean','load'],source:'Slides 4–6'},
  {id:'path',number:'02',name:'Follow the PATH',short:'PATH & export',description:'Choose which program runs, then see what a child process inherits.',prompt:'Put the system folder first. Which Python runs?',tiles:['shell','PATH','process'],source:'Slides 9, 13–16'},
  {id:'streams',number:'03',name:'Route the output',short:'Streams',description:'Send stdout and stderr to a terminal, a file, or the next command.',prompt:'Run append twice, then replace once. What remains in out.txt?',tiles:['stdout','→','file / pipe'],source:'Slides 4, 20, 34, 39'},
  {id:'control',number:'04',name:'Step through logic',short:'Control flow',description:'Follow a branch, walk a loop, and predict what runs after a failure.',prompt:'Predict the next step, then follow the highlighted route.',tiles:['test','branch','result'],source:'Slides 21–28, 35–36'},
  {id:'venv',number:'05',name:'Build a virtual environment',short:'Virtual environments',description:'See what .venv contains, create one with uv, and discover which Python can use its packages.',prompt:'Follow the commands until app.py can import requests.',tiles:['Python','.venv','your code'],source:'Slides 47–53'},
  {id:'environments',number:'06',name:'Isolate a project',short:'Dependency conflicts',description:'Make a version conflict, separate the projects, and rebuild from a lock.',prompt:'Install B. Can A still run? Then try separate environments.',tiles:['project A','.venv','project B'],source:'Slides 47–53'}
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
  environments:()=>({isolated:false,required:{a:'1.0',b:'2.0'},installed:{shared:resolvePackages('1.0'),a:null,b:null},locks:{a:null,b:null},newer:false,message:'Project A works in the shared environment. Install B to reveal the conflict.',error:false}),
  venv:()=>createVirtualEnvironmentDemo()
};
const states = Object.fromEntries(Object.entries(initial).map(([key,fn])=>[key,fn()]));
let current = new URLSearchParams(location.search).get('activity');
if (!activities.some(activity => activity.id === current)) current = null;
let toastTimer;
function notify(message) { $('#toast').textContent = message; clearTimeout(toastTimer); toastTimer = setTimeout(()=>{$('#toast').textContent='';},4000); }
function setResult(html) {
  const focused = document.activeElement?.id;
  const opened = [...$('#results').querySelectorAll('details[open][id]')].map(node=>node.id);
  $('#results').innerHTML = html;
  opened.forEach(id=>{const node=document.getElementById(id);if(node)node.open=true;});
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
  $('#main').innerHTML = `<a class="back" href="index.html">← All interactives</a><div class="activity-heading"><div><p class="eyebrow" style="margin-top:26px;margin-bottom:8px">${activity.number} / ${activity.source} / Classroom simulation</p><h1>${activity.name}</h1></div><div class="heading-tools"><button id="reset">Reset</button><button id="copy-link">Copy link</button></div></div><nav class="activity-tabs" aria-label="Activities">${activities.map(item=>`<a href="?activity=${item.id}" ${item.id===current?'aria-current="page"':''}>${item.short}</a>`).join('')}</nav><aside class="prompt"><strong>Try this</strong>${activity.prompt}</aside><div class="workspace"><section class="panel" id="controls" aria-label="Activity controls"></section><div class="result-column" id="results" aria-label="Simulation results" aria-live="polite" aria-atomic="false"></div></div>`;
  $('#reset').addEventListener('click',()=>{document.querySelectorAll('.workspace details[open]').forEach(detail=>{detail.open=false;});states[current]=initial[current]();renderers[current]();notify('Activity reset.');});
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
  $('#controls').innerHTML=`<h2>Clean the names</h2><label class="check primary-choice"><input id="normalize" type="checkbox" ${state.normalize?'checked':''}>Trim spaces & lowercase names</label><p class="hint">The output changes immediately.</p><details class="explore" id="pipeline-options"><summary>Explore more</summary><label class="field"><span>Synthetic records</span><textarea id="raw-data" rows="7" spellcheck="false" maxlength="15000">${esc(state.raw)}</textarea><small>One name,score pair per line; no header or quoted commas.</small></label><label class="check"><input id="validate" type="checkbox" ${state.validate?'checked':''}>Require a name and score 0–100</label><label class="check"><input id="unique" type="checkbox" ${state.unique?'checked':''}>Remove exact duplicate pairs</label><label class="check"><input id="filter" type="checkbox" ${state.filter?'checked':''}>Keep scores at or above a minimum</label><label class="field"><span>Minimum score <output id="minimum-label">${state.minimum}</output></span><input type="range" id="minimum" min="0" max="100" value="${state.minimum}"></label></details>`;
  $('#controls').oninput=pipelineInput;updatePipeline();
}
function pipelineInput() {
  const state=states.pipeline;state.raw=$('#raw-data').value;
  for(const key of ['normalize','validate','unique','filter'])state[key]=readBool(key);
  state.minimum=Number($('#minimum').value);$('#minimum-label').textContent=state.minimum;updatePipeline();
}
function updatePipeline() {
  const state=states.pipeline,result=pipeline(state.raw,state),names=['Extract','Clean','Validate','Dedupe','Filter'],enabled=[true,state.normalize,state.validate,state.unique,state.filter];
  setResult(`<section class="panel primary-result"><div class="panel-head"><h2>From input to output</h2><span class="badge">${result.rows.length} rows ready</span></div><div class="flow" aria-label="Record counts at each stage">${result.stages.map((rows,index)=>`${index?'<span class="flow-arrow" aria-hidden="true">→</span>':''}<div class="flow-node ${enabled[index]?'active':'off'}">${names[index]}<strong>${rows.length}</strong><span class="sub">${enabled[index]?'records':'bypassed'}</span></div>`).join('')}</div><h3 class="result-label">Final output</h3>${result.rows.length?`<div class="table-wrap"><table><thead><tr><th scope="col">Name</th><th scope="col">Score</th></tr></thead><tbody>${result.rows.map(row=>`<tr><td>${esc(row.name)||'∅'}</td><td>${esc(row.score)||'∅'}</td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">No records remain. Change the input or a filter.</p>'}<details class="explore" id="pipeline-details"><summary>How it works</summary><p>Each stage receives the previous stage’s output. Duplicate removal compares both name and score after cleaning. A bypassed step changes nothing.</p><div class="terminal"><div class="label">Conceptual pipeline</div><pre>extract${state.normalize?' | normalize':''}${state.validate?' | validate':''}${state.unique?' | deduplicate':''}${state.filter?` | filter_minimum ${state.minimum}`:''} &gt; cleaned.csv</pre></div><p class="hint">These stage names illustrate programs, not built-in shell commands.</p><h3>Output text</h3><pre>${esc(result.text)||'(empty)'}</pre></details></section>`);
}

function renderPath() {
  const state=states.path;
  $('#controls').innerHTML=`<h2>Choose the order</h2><div class="guided-actions"><button id="system-first" class="primary">System folder first</button><button id="local-first">Local folder first</button></div><details class="explore" id="path-options"><summary>Explore more</summary><label class="field"><span>External command</span><select id="command"><option value="python" ${state.command==='python'?'selected':''}>python</option><option value="greetings.sh" ${state.command==='greetings.sh'?'selected':''}>greetings.sh</option></select></label><div id="path-order-controls"></div><hr class="control-divider"><label class="field"><span>Parent shell variable PET</span><input id="pet" maxlength="80" value="${esc(state.pet)}"></label><label class="check"><input id="exported" type="checkbox" ${state.exported?'checked':''}>Export PET to new child processes</label><div id="inheritance-preview"></div><p class="hint">Exporting PET does not change PATH. Each edit models a newly launched child.</p></details>`;
  $('#controls').oninput=event=>{
    if(event.target.matches('[data-executable]')){state.directories[Number(event.target.dataset.executable)].commands[state.command].executable=event.target.checked;}
    else{state.command=$('#command').value;state.pet=$('#pet').value;state.exported=readBool('exported');}
    updatePath();
  };
  $('#controls').onclick=event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.id==='system-first'||button.id==='local-first'){
      const preferred=button.id==='system-first'?'/usr/bin':'/usr/local/bin';
      state.directories.sort((a,b)=>a.path===preferred?-1:b.path===preferred?1:0);
    }else if(button.matches('[data-move]')){
      const index=Number(button.dataset.index),next=index+Number(button.dataset.move);
      [state.directories[index],state.directories[next]]=[state.directories[next],state.directories[index]];
    }else return;
    updatePath();
  };
  updatePath();
}
function updatePath() {
  const state=states.path,result=commandLookup(state.directories,state.command),env=inheritVariable(state.pet,state.exported);
  const focused=document.activeElement?.id;
  $('#path-order-controls').innerHTML=state.directories.map((dir,index)=>`<div class="path-option"><code>${esc(dir.path)}</code><div class="dir-actions"><button id="up-${index}" data-move="-1" data-index="${index}" aria-label="Move ${esc(dir.path)} earlier" ${index===0?'disabled':''}>↑</button><button id="down-${index}" data-move="1" data-index="${index}" aria-label="Move ${esc(dir.path)} later" ${index===state.directories.length-1?'disabled':''}>↓</button><label><input type="checkbox" id="executable-${index}" data-executable="${index}" ${dir.commands[state.command].executable?'checked':''} aria-label="${esc(state.command)} is executable in ${esc(dir.path)}"><span class="small-label">executable</span></label></div></div>`).join('');
  $('#inheritance-preview').innerHTML=`<div class="process-box"><h3>New child process</h3><pre>${env.child===null?'PET is unset':`PET=${esc(shellQuote(env.child))}`}</pre><p class="hint">echo "My favorite animal: $PET!"</p><pre>${esc(env.childOutput)}</pre></div>`;
  setResult(`<section class="panel primary-result"><div class="panel-head"><h2>First executable match wins</h2><span class="badge ${result.found<0?'error':''}">${esc(state.command)}</span></div><ol class="dir-list">${state.directories.map((dir,index)=>`<li class="directory ${result.found===index?'selected':result.found>=0&&index>result.found?'unvisited':''}"><span class="dir-rank">${index+1}</span><div class="dir-info"><div class="dir-name">${esc(dir.path)}</div><div class="dir-status">${result.searched[index].state}</div></div></li>`).join('')}</ol><div class="terminal main-output"><div class="label">This program runs</div><pre>${result.path?`${esc(result.path)}\n${esc(result.version)}`:`${esc(state.command)}: command not found\nExit status: 127`}</pre></div><details class="explore" id="path-details"><summary>How it works</summary><pre class="path-string">PATH=${esc(state.directories.map(dir=>dir.path).join(':'))}</pre><p>The shell searches these folders in order. A name containing /, such as ./greetings.sh, names a path directly instead.</p><p>This model assumes a fresh external-command lookup, without aliases, functions, builtins, or cached paths. The folders and installations are examples.</p>${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Command-Search-and-Execution.html','Bash: command search')}${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Environment.html','Bash: environment')}</details></section>`);
  if(focused)document.getElementById(focused)?.focus({preventScroll:true});
}

function renderStreams() {
  const state=states.streams;
  $('#controls').innerHTML=`<h2>Choose a route</h2><label class="field"><span>Redirection or pipe</span><select id="stream-mode">${Object.entries(STREAM_MODES).map(([key,mode])=>`<option value="${key}" ${state.mode===key?'selected':''}>${esc(mode.label)}</option>`).join('')}</select></label><button class="primary" id="run-stream">Run →</button><details class="explore" id="streams-options"><summary>Explore more</summary><label class="field"><span>stdout · data</span><textarea id="stdout" rows="3" maxlength="3000" spellcheck="false">${esc(state.stdout)}</textarea></label><label class="field"><span>stderr · diagnostics</span><textarea id="stderr" rows="3" maxlength="3000" spellcheck="false">${esc(state.stderr)}</textarea></label><label class="field"><span>Pipe: literal text to keep</span><input id="pattern" value="${esc(state.pattern)}" maxlength="60"><small>grep -F is case sensitive; an empty pattern matches every line.</small></label></details>`;
  $('#controls').oninput=()=>{state.mode=$('#stream-mode').value;state.stdout=$('#stdout').value;state.stderr=$('#stderr').value;state.pattern=$('#pattern').value;state.result=null;updateStreams();};
  $('#run-stream').onclick=()=>{state.result=routeStreams(state);state.file=state.result.file;state.runs+=1;updateStreams();notify(`Run ${state.runs} complete.`);};updateStreams();
}
function updateStreams() {
  const state=states.streams,mode=STREAM_MODES[state.mode],result=state.result,preview=routeStreams(state),destination={terminal:'terminal',file:'out.txt',errors:'errors.txt',discard:'/dev/null',pipe:'grep -F → terminal'};
  const suffix=mode.suffix.replace('PATTERN',shellQuote(state.pattern));
  setResult(`<section class="panel primary-result"><div class="panel-head"><h2>Follow the output</h2><span class="badge">${state.runs} runs</span></div><div class="terminal"><div class="label">Simulated command</div><pre>produce${esc(suffix)}</pre></div><div class="route-grid"><div class="stream-node">stdout <small>data</small></div><div class="route-arrow" aria-hidden="true">→</div><div class="stream-destination">${destination[preview.routes.stdout]}</div><div class="stream-node stderr">stderr <small>diagnostics</small></div><div class="route-arrow" aria-hidden="true">→</div><div class="stream-destination">${destination[preview.routes.stderr]}</div></div><div class="split"><div class="output-block"><h3>Terminal · last run</h3><pre>${result?esc(result.terminal)||'(no output)':'Press Run to see the output.'}</pre></div><div class="output-block"><h3>out.txt · kept between runs</h3><pre>${esc(state.file)||'(empty file)'}</pre></div>${state.mode==='errors'?`<div class="output-block"><h3>errors.txt · last run</h3><pre>${result?esc(result.errors)||'(empty)':'(waiting)'}</pre></div>`:''}</div><details class="explore" id="streams-details"><summary>How it works${preview.piped?' · inspect the pipe':''}</summary><p>${state.mode==='order'?'Redirections apply left to right: 2>&1 copies stdout’s terminal destination before stdout is sent to the file.':state.mode==='combined'?'First stdout is opened on the file; then 2>&1 copies that destination for stderr.':preview.piped?'A pipe connects stdout to the next command. stderr joins only when explicitly redirected.':'A plain > or >> applies to stdout. stderr keeps its terminal destination unless redirected.'}</p>${preview.piped?`<div class="split"><div class="output-block"><h3>Pipe input</h3><pre>${result?esc(result.pipe)||'(empty)':'(waiting)'}</pre></div><div class="output-block"><h3>grep output ${result?`· exit ${result.filterStatus}`:''}</h3><pre>${result?esc(result.filtered)||'(no matching lines)':'(waiting)'}</pre></div></div>`:''}<p>${state.mode==='replace'||state.mode==='combined'||state.mode==='order'?'Opening out.txt with > truncates it before writing, even if stdout is empty.':state.mode==='append'?'Opening out.txt with >> keeps its bytes and adds new output at the end.':'The selected destinations determine which output is stored, displayed, filtered, or discarded.'}</p><p class="hint">The fictional produce command emits stdout first, then stderr. Real programs may buffer streams differently. Reset restores the initial file.</p>${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Redirections.html','Bash: redirections')}${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Pipelines.html','Bash: pipelines')}</details></section>`);
}

function renderControl() {
  const state=states.control,exploring=Boolean($('#control-options')?.open);
  $('#controls').innerHTML=`<h2>Choose a scenario</h2><label class="field"><span>Follow one example</span><select id="control-mode"><option value="branch" ${state.mode==='branch'?'selected':''}>If: choose a branch</option><option value="loop" ${state.mode==='loop'?'selected':''}>For: repeat for each name</option><option value="chain" ${state.mode==='chain'?'selected':''}>&& / || / ;: run or skip</option></select></label>${state.mode==='branch'?`<label class="check"><input type="checkbox" id="file-exists" ${state.exists?'checked':''}>data.txt exists as a regular file</label>`:state.mode==='loop'?`<label class="field"><span>Names</span><input id="names" value="${esc(state.names)}" maxlength="180"><small>Separate names with commas.</small></label>`:`<label class="field"><span>When should load_data run?</span><select id="operator"><option ${state.operator==='&&'?'selected':''} value="&&">&& · after success</option><option ${state.operator==='||'?'selected':''} value="||">|| · after failure</option><option ${state.operator===';'?'selected':''} value=";">; · either way</option></select></label><label class="field"><span>check_data result</span><select id="first-status">${[0,1,2].map(value=>`<option value="${value}" ${state.first===value?'selected':''}>${value} · ${value===0?'success':'failure'}</option>`).join('')}</select></label>`}<div class="run-row"><button class="primary" id="step">Step →</button><button id="restart">Start again</button></div><details class="explore" id="control-options" ${exploring?'open':''}><summary>Explore more</summary>${state.mode==='chain'?`<label class="field"><span>load_data result</span><select id="second-status">${[0,1,2].map(value=>`<option value="${value}" ${state.second===value?'selected':''}>${value} · ${value===0?'success':'failure'}</option>`).join('')}</select></label>`:''}<button id="run-all">Run to end</button><p class="hint">Changing an input restarts the trace. These commands are simulated; the statuses above are selected inputs.</p></details>`;
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
  $('#restart').onclick=()=>{state.step=0;updateControl();};updateControl();
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
  setResult(`<section class="panel primary-result"><div class="panel-head"><h2>Follow the highlighted step</h2><span class="badge">${state.step} / ${trace.length}</span></div>${diagram}<div class="output-block main-output"><h3>Output so far</h3><pre>${esc(seen.map(step=>step.output).join(''))||'Predict, then press Step.'}</pre></div><details class="explore" id="control-details"><summary>Explore more: code and trace</summary><div class="terminal"><div class="label">Bash · simulated</div><ol class="code-lines">${lines.map((line,index)=>`<li class="${active?.line===index?'active':''}">${esc(line)}</li>`).join('')}</ol></div><h3 class="result-label">Execution trace</h3>${seen.length?`<ol class="trace">${seen.map((step,index)=>`<li class="${index===seen.length-1?'current':''}"><span class="trace-index">${index+1}</span><span>${esc(step.label)}</span></li>`).join('')}</ol>`:'<p class="empty">No steps run yet.</p>'}${sourceLink('https://www.gnu.org/software/bash/manual/html_node/Lists.html','Bash: command lists')}</details></section>`);
  $('#step').disabled=state.step===trace.length;$('#run-all').disabled=state.step===trace.length;$('#restart').disabled=state.step===0;
}

function renderEnvironments() {
  const state=states.environments;
  $('#controls').innerHTML=`<h2>Try installing B</h2><label class="field"><span>Where packages live</span><select id="isolation"><option value="shared" ${!state.isolated?'selected':''}>One shared environment</option><option value="isolated" ${state.isolated?'selected':''}>Separate environments</option></select></label><div class="guided-actions"><button id="install-b" class="primary" data-env-action="install" data-project="b">Install B</button><button id="install-a" data-env-action="install" data-project="a">Install A</button></div><details class="explore" id="environments-options"><summary>Explore more</summary><label class="field"><span>A requires coursekit</span><select id="require-a">${['1.0','2.0'].map(v=>`<option value="${v}" ${state.required.a===v?'selected':''}>== ${v}</option>`).join('')}</select></label><label class="field"><span>B requires coursekit</span><select id="require-b">${['1.0','2.0'].map(v=>`<option value="${v}" ${state.required.b===v?'selected':''}>== ${v}</option>`).join('')}</select></label><label class="check"><input type="checkbox" id="newer" ${state.newer?'checked':''}>New compatible helper releases</label><p class="hint">Save a lock, install with a newer release, then sync the saved versions.</p>${['a','b'].map(project=>`<h3>Project ${project.toUpperCase()}</h3><div class="run-row"><button id="lock-${project}" data-env-action="lock" data-project="${project}">Create lock</button><button id="sync-${project}" data-env-action="sync" data-project="${project}" ${!state.locks[project]?'disabled':''}>Sync locked</button></div>`).join('')}</details>`;
  $('#controls').oninput=()=>{
    state.isolated=$('#isolation').value==='isolated';state.required.a=$('#require-a').value;state.required.b=$('#require-b').value;state.newer=readBool('newer');state.message=state.isolated?'Install A and B into their separate environments.':'Install a project to change the shared packages.';state.error=false;updateEnvironments();
  };
  $('#controls').onclick=event=>{
    const button=event.target.closest('[data-env-action]');if(!button)return;
    const project=button.dataset.project,action=button.dataset.envAction;
    if(action==='lock'){
      state.locks[project]=resolvePackages(state.required[project],state.newer);state.message=`Project ${project.toUpperCase()}: saved coursekit ${state.locks[project].coursekit} and helper ${state.locks[project].helper} in its lock.`;state.error=false;
    }else{
      const next=installEnvironment(state,project,{locked:action==='sync'});
      if(next.error){state.error=true;state.message=next.error;}
      else{Object.assign(state,next.state);state.error=false;state.message=`${project.toUpperCase()} ${action==='sync'?'restored its locked versions':'installed its packages'}. ${!state.isolated?'Both projects see the shared packages.':'The other environment is unchanged.'}`;}
    }
    updateEnvironments();
  };updateEnvironments();
}
function updateEnvironments() {
  const state=states.environments,projects=environmentState(state);
  ['a','b'].forEach(project=>{$('#sync-'+project).disabled=!state.locks[project];});
  const packageBox=(packages,label,status)=>`<div class="package-box ${status==='conflict'?'error':''}"><h3>${label}</h3><pre>${packages?`coursekit == ${packages.coursekit}`:'No packages installed'}</pre></div>`;
  setResult(`<section class="panel primary-result"><div class="panel-head"><h2>${state.isolated?'Two separate environments':'One shared environment'}</h2><span class="badge ${projects.some(project=>!project.ok)?'error':''}">${projects.filter(project=>project.ok).length} / 2 ready</span></div><div class="split">${projects.map(project=>`<div class="env-project"><div class="panel-head"><h3>Project ${project.project.toUpperCase()}</h3><span class="badge ${project.ok?'':'error'}">${project.ok?'Ready':project.missing?'Missing':'Conflict'}</span></div><p>Needs <code>coursekit == ${project.required}</code></p>${state.isolated?packageBox(project.actual,`${project.project}/.venv`,project.ok?'ok':project.missing?'missing':'conflict'):`<p>${project.ok?'✓ Requirement satisfied':'× '+(project.missing?'Not installed':`Has ${project.actual.coursekit}; needs ${project.required}`)}</p>`}</div>`).join('')}</div>${!state.isolated?`<div class="env-connector" aria-hidden="true">↘ &nbsp; ↙</div>${packageBox(state.installed.shared,'Shared packages',projects.every(p=>p.ok)?'ok':'conflict')}`:''}<div class="message main-output ${state.error?'error':''}" role="status">${esc(state.message)}</div><details class="explore" id="environments-details"><summary>How it works · saved locks</summary><p>coursekit and helper are fictional packages. Installing replaces packages only in the selected environment; separate terminals alone do not isolate packages.</p><div class="split">${projects.map(project=>`<div class="lock-card"><h3>Project ${project.project.toUpperCase()}</h3><p>Installed: <code>${project.actual?`coursekit ${project.actual.coursekit}, helper ${project.actual.helper}`:'none'}</code></p><p>Saved lock: <code>${state.locks[project.project]?`coursekit ${state.locks[project.project].coursekit}, helper ${state.locks[project.project].helper}`:'none'}</code></p></div>`).join('')}</div><p>Install resolves fresh versions in this model. Create lock saves that resolution. Sync locked restores it and rejects a lock that no longer matches the requirement.</p><p>Real uv normally reuses a valid lock during uv add, uv sync, and uv run. New releases do not silently update it. Python, operating systems, data, and configuration also affect reproducibility.</p>${sourceLink('https://docs.astral.sh/uv/concepts/projects/sync/','uv: locking and syncing')}</details></section><details class="explore panel setup-explore" id="environment-real-setup"><summary>Explore more: set up two real projects</summary>${installCommands()}${setupExamples()}</details>`);
}

function installCommands() {
  return `<section class="panel" id="uv-install-commands" aria-labelledby="uv-install-title"><h2 id="uv-install-title">Install uv and Python</h2><p class="hint">Run once per computer · Bash / Zsh on macOS, Linux, or WSL.</p><div class="terminal"><div class="label">Install uv</div><pre>curl -LsSf https://astral.sh/uv/install.sh | sh</pre></div><p class="hint">Open a new terminal, then check uv and install Python 3.11:</p><div class="terminal"><div class="label">Check uv · install Python</div><pre>uv --version
uv python install 3.11</pre></div><p class="hint">This installs the tools. Create each project’s .venv below.</p>${sourceLink('https://docs.astral.sh/uv/getting-started/installation/','uv: installation')}${sourceLink('https://docs.astral.sh/uv/guides/install-python/','uv: installing Python')}</section>`;
}
function setupExamples() {
  return `<section aria-labelledby="setup-examples-title"><h2 id="setup-examples-title">Set up both environments</h2><p class="hint">Open two fresh terminals in the same parent folder, outside any existing uv project. Each setup creates its own project and .venv. These fixed, simplified transcripts show the course README’s dbt / Pub/Sub conflict; the diagram above uses fictional packages.</p><div class="setup-terminals"><section class="terminal setup-terminal" aria-labelledby="setup-title-a"><div class="setup-terminal-header"><div><div class="label">project-1 / .venv</div><h2 id="setup-title-a">Setup 1 · dbt</h2></div><span class="badge error">Conflict rejected</span></div><div class="terminal-transcript" tabindex="0" aria-label="Setup 1 simulated terminal output"><pre class="terminal-command">$ uv init --no-package --python 3.11 project-1
$ cd project-1

# Create and activate this environment
$ uv venv --python 3.11
$ source .venv/bin/activate

# Install the project dependency
$ uv add dbt-core==1.7.14</pre><pre class="terminal-output">dbt-core is installed in project-1/.venv.</pre><pre class="terminal-command">$ uv add google-cloud-pubsub==2.40.0</pre><pre class="terminal-error">No solution found (simulated summary)

dbt-core==1.7.14
  requires protobuf &gt;=4.0.0,&lt;5
google-cloud-pubsub==2.40.0
  requires protobuf &gt;=6.33.5,&lt;8.0.0

These ranges do not overlap.
The failed add leaves installed packages
and uv.lock unchanged.</pre></div></section><section class="terminal setup-terminal" aria-labelledby="setup-title-b"><div class="setup-terminal-header"><div><div class="label">project-2 / .venv</div><h2 id="setup-title-b">Setup 2 · Pub/Sub</h2></div><span class="badge">Ready</span></div><div class="terminal-transcript" tabindex="0" aria-label="Setup 2 simulated terminal output"><pre class="terminal-command">$ uv init --no-package --python 3.11 project-2
$ cd project-2

# Create and activate this environment
$ uv venv --python 3.11
$ source .venv/bin/activate

# Install the project dependency
$ uv add google-cloud-pubsub==2.40.0</pre><pre class="terminal-output">google-cloud-pubsub is installed
in project-2/.venv.

Its protobuf version satisfies
&gt;=6.33.5,&lt;8.0.0.

project-1/.venv is unchanged.</pre></div></section></div><p class="hint"><code>uv venv</code> creates .venv. <code>uv add</code> installs packages and updates pyproject.toml and uv.lock.</p><p class="hint">Activation selects this environment for plain <code>python</code> commands; it is optional for <code>uv add</code> and <code>uv run</code>. Separate environments provide isolation; opening two terminals alone does not.</p>${sourceLink('https://github.com/ksiller/DS2022/blob/main/class/03-scripting/README.md#why-isolate-environments','Course README: the conflict example')}</section>`;
}
const renderers={pipeline:renderPipeline,path:renderPath,streams:renderStreams,control:renderControl,environments:renderEnvironments,venv:()=>renderVirtualEnvironment({state:states.venv,controls:$('#controls'),results:$('#results'),setResult})};
activityPage();
