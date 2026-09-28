import {MAKERS,ITEMS,STATES,insertItem,joinItems,normalizationView,parseCents,createTransfer,transferAction,ETL_SAMPLE,transformEmployees} from './models.mjs';
import {QUERY_EXAMPLES} from './sql-core.mjs';
import {createSQLClient} from './sql-client.mjs';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const activities=[
  {id:'keys',number:'01',name:'Connect the rows',short:'Keys & joins',description:'Try a maker ID and see whether the row can be added.',tiles:['Items','maker_id','Makers'],prompt:'Try maker 99, then choose an existing maker and try again. Why does only one work?'},
  {id:'normalization',number:'02',name:'Store each fact once',short:'Normalization',description:'Move one employee and find a missed copy of a fact.',tiles:['1NF','update','3NF'],prompt:'Move Alice #1 in 1NF, then try 3NF. Which design avoids a missed copy?'},
  {id:'queries',number:'03',name:'Ask the database',short:'SQL sandbox',description:'Edit a query, run real SQL, and inspect the rows.',tiles:['SQL','SQLite','rows'],prompt:'Run the query. Then add WHERE employee_id = 1 before ORDER BY and run it again.'},
  {id:'transactions',number:'04',name:'Finish the whole transfer',short:'Transactions',description:'Follow a transfer until both changes commit together.',tiles:['BEGIN','updates','COMMIT'],prompt:'Step through the $25 transfer. When do the committed balances change?'},
  {id:'etl',number:'05',name:'Turn JSON into rows',short:'JSON → SQL',description:'Clean a small batch and load its accepted rows.',tiles:['JSON','clean','SQL'],prompt:'Load the sample twice. Are any rows from the second load kept?'}
];
const params=new URLSearchParams(location.search);let current=activities.find(activity=>activity.id===params.get('activity'))?.id??null;
let client=null,toastTimer,renderGeneration=0;
const initial={
 keys:()=>({items:ITEMS.map(row=>({...row})),id:'12344',name:'Gear A',quantity:'5',maker:'99',enforce:true,join:'inner',highlight:99,message:'Maker 99 has no matching row. Predict what INSERT will do.',error:false}),
 normalization:()=>({form:1,update:'none',target:51}),
 transactions:()=>({model:createTransfer(),amount:'25.00',failCredit:false}),
 queries:()=>({sql:QUERY_EXAMPLES[0].sql,example:'select',ready:false,busy:false}),
 etl:()=>({raw:ETL_SAMPLE,trimNames:true,normalizeStates:true,duplicates:'skip',ready:false,busy:false,imported:{columns:['employee_id','name','state_code'],values:[]},message:'Validate the source, then load the accepted rows.',error:false})
};
const states=Object.fromEntries(Object.entries(initial).map(([key,create])=>[key,create()]));
const disclosures=new Map();
function rememberDisclosures(root=document){root.querySelectorAll('details[data-disclosure]').forEach(item=>disclosures.set(item.dataset.disclosure,item.open));}
function put(selector,html){
 const target=$(selector);rememberDisclosures(target);target.innerHTML=html;
 target.querySelectorAll('details[data-disclosure]').forEach(item=>{
  item.open=disclosures.get(item.dataset.disclosure)??false;
  item.addEventListener('toggle',()=>disclosures.set(item.dataset.disclosure,item.open));
 });
}
function extra(key,label,html){return `<details class="technical" data-disclosure="${key}"><summary>${label}</summary><div class="detail-body">${html}</div></details>`;}
function notify(message){$('#toast').textContent=message;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').textContent='';},4000);}
function cell(value){return value===null?'<span class="null">NULL</span>':esc(value);}
function table(columns,rows,{highlight=()=>false,warning=()=>false}={}){
 return `<div class="table-wrap"><table><thead><tr>${columns.map(column=>`<th scope="col">${esc(column)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map((row,index)=>`<tr class="${warning(row,index)?'warning':highlight(row,index)?'highlight':''}">${row.map(value=>`<td>${cell(value)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${columns.length}" class="empty">No rows.</td></tr>`}</tbody></table></div>`;
}
function modelTable(name,columns,records,options={}){return `<div class="table-card"><h3>${name}</h3>${table(columns,records.map(record=>columns.map(column=>record[column])),options)}</div>`;}
function result(html,advanced=''){const focused=document.activeElement?.id;put('#results',html);put('#advanced-results',advanced);if(focused)document.getElementById(focused)?.focus({preventScroll:true});}
function source(url,label){return `<p class="source-link">Reference: <a href="${url}" target="_blank" rel="noopener">${label} ↗</a></p>`;}
function gallery(){
 $('#main').innerHTML=`<section class="gallery-header"><div><p class="eyebrow">Lecture 05 / Student playground</p><h1>Make a change.<br>See the relationship.</h1><p class="intro">Choose an activity. Try one change, then explore more.</p></div><div class="stamp">Small datasets.<br>Visible consequences.<br>A separate link for every activity.</div></section><div class="gallery">${activities.map(activity=>`<a class="activity-card" href="?activity=${activity.id}"><span class="number">${activity.number}</span><div class="mini" aria-hidden="true">${activity.tiles.map((tile,index)=>`${index?'<span class="arrow">→</span>':''}<span class="tile ${index===1?'orange':index===2?'blue':''}">${tile}</span>`).join('')}</div><h2>${activity.name}</h2><p>${activity.description}</p><span class="card-link">Open interactive<span>↗</span></span></a>`).join('')}</div><p class="section-note">The sandbox and ETL loader execute SQLite locally. The other activities are labeled teaching models. Data stays in this tab; refreshing or leaving an activity resets its experiment.</p>`;
}
function render(){
 renderGeneration+=1;client?.close();client=null;
 if(!current){gallery();return;}
 const activity=activities.find(item=>item.id===current);
 document.title=`${activity.short} · Lecture 05 interactive lab`;
 rememberDisclosures();
 put('#main',`<a class="back" href="index.html">← All SQL interactives</a><div class="activity-heading"><div><p class="eyebrow" style="margin-top:26px;margin-bottom:8px">${activity.number} / ${['queries','etl'].includes(current)?'Local SQLite':'Classroom model'}</p><h1>${activity.name}</h1></div><div class="heading-tools"><button id="reset">Reset activity</button><button id="copy-link">Copy activity link</button></div></div><aside class="task"><strong>Try this</strong><p>${activity.prompt}</p></aside><div class="workspace ${current==='queries'?'query-workspace':current==='etl'?'wide':''}"><section class="panel" id="controls" aria-label="Activity controls"></section><div class="result-column" id="results" aria-label="Activity results"></div></div><details class="explore-more" data-disclosure="explore"><summary>Explore more</summary><div class="advanced-grid"><section id="advanced-controls" class="panel" aria-label="More controls"></section><div id="advanced-results" class="result-column"></div></div><nav class="activity-tabs" aria-label="Activities">${activities.map(item=>`<a href="?activity=${item.id}" ${item.id===current?'aria-current="page"':''}>${item.short}</a>`).join('')}</nav></details>`);
 $('#reset').onclick=()=>{states[current]=initial[current]();render();notify('Activity and data reset.');};
 $('#copy-link').onclick=async()=>{const url=new URL('index.html',location.href);url.searchParams.set('activity',current);try{await navigator.clipboard.writeText(url.href);notify('Direct activity link copied.');}catch{let field=$('#copy-fallback');if(!field){field=document.createElement('input');field.id='copy-fallback';$('#controls').prepend(field);}field.value=url.href;field.setAttribute('aria-label','Activity link — select and copy');field.style.width='100%';$('#controls').prepend(field);field.focus();field.select();notify('Copy the selected link in the controls.');}};
 renderers[current]();
}

function renderKeys(){
 const s=states.keys;
 put('#controls',`<h2>Add this item</h2><p class="sample-row" id="item-preview"></p><label class="field"><span>maker_id · foreign key</span><select id="maker">${[...MAKERS,{maker_id:99,maker:'No matching maker'}].map(row=>`<option value="${row.maker_id}" ${String(row.maker_id)===s.maker?'selected':''}>${row.maker_id} · ${esc(row.maker)}</option>`).join('')}</select></label><button class="primary" id="insert-item">Try INSERT</button>`);
 put('#advanced-controls',`<h2>Try another row</h2><div class="presets"><button data-preset="valid">Valid row</button><button data-preset="duplicate">Duplicate ID</button><button data-preset="orphan">Orphan maker</button></div><label class="field"><span>item_id · primary key</span><input id="item-id" inputmode="numeric" value="${esc(s.id)}" maxlength="10"></label><label class="field"><span>item_name</span><input id="item-name" value="${esc(s.name)}" maxlength="80"></label><label class="field"><span>item_qty</span><input id="quantity" inputmode="numeric" value="${esc(s.quantity)}" maxlength="8"></label><label class="check"><input id="enforce-fk" type="checkbox" ${s.enforce?'checked':''}>Enforce the maker foreign key</label><hr class="control-divider"><label class="field"><span>Join type</span><select id="join-type"><option value="inner" ${s.join==='inner'?'selected':''}>INNER JOIN · matching rows</option><option value="left" ${s.join==='left'?'selected':''}>LEFT JOIN · every item</option></select></label><label class="field"><span>Highlight a maker</span><select id="highlight-maker">${[...MAKERS,{maker_id:99,maker:'No matching maker'}].map(row=>`<option value="${row.maker_id}" ${s.highlight===row.maker_id?'selected':''}>${row.maker_id} · ${esc(row.maker)}</option>`).join('')}</select></label>`);
 const input=event=>{s.id=$('#item-id').value;s.name=$('#item-name').value;s.quantity=$('#quantity').value;s.maker=$('#maker').value;s.enforce=$('#enforce-fk').checked;s.join=$('#join-type').value;s.highlight=event.target.id==='maker'?Number(s.maker):Number($('#highlight-maker').value);$('#highlight-maker').value=String(s.highlight);updateKeys();};
 $('#controls').oninput=input;$('#advanced-controls').oninput=input;
 $('#advanced-controls').onclick=event=>{const preset=event.target.closest('[data-preset]')?.dataset.preset;if(!preset)return;s.id=preset==='duplicate'?'12340':String(Math.max(...s.items.map(row=>row.item_id))+1);s.maker=preset==='orphan'?'99':'2';s.highlight=Number(s.maker);s.message='Predict whether this row passes the constraints, then try INSERT.';s.error=false;renderKeys();};
 $('#insert-item').onclick=()=>{const outcome=insertItem(s.items,{item_id:s.id,item_name:s.name,item_qty:s.quantity,maker_id:s.maker},{enforceForeignKey:s.enforce});s.items=outcome.items;s.error=Boolean(outcome.error);s.message=outcome.error?`${outcome.constraint}: ${outcome.error} No row was added.`:`Inserted item ${s.id}. ${Number(s.maker)===99?'The orphan is visible because foreign-key enforcement is disabled.':'Its maker_id refers to an existing maker.'}`;updateKeys();};
 updateKeys();
}
function updateKeys(){
 const s=states.keys,joined=joinItems(s.items,s.join),orphans=s.items.filter(item=>!MAKERS.some(maker=>maker.maker_id===item.maker_id));
 $('#item-preview').textContent=`${s.name} · ID ${s.id} · quantity ${s.quantity}`;
 result(`<div class="message ${s.error?'error':'success'}" role="status">${esc(s.message)}</div><section class="panel"><div class="panel-head"><h2>Items connect to makers</h2><span class="badge ${s.enforce?'':'error'}">FK ${s.enforce?'enforced':'disabled'}</span></div><div class="keys-grid">${modelTable('Items',['item_id','item_name','maker_id'],s.items,{highlight:row=>row[2]===s.highlight,warning:row=>row[2]===99})}${modelTable('Makers',['maker_id','maker'],MAKERS,{highlight:row=>row[0]===s.highlight})}</div><div class="relation"><code>Items.maker_id</code> → <code>Makers.maker_id</code><br><span class="hint">Many items can refer to one maker.</span></div>${orphans.length?`<p class="hint">${orphans.length} item${orphans.length===1?' has':'s have'} no matching maker.</p>`:''}</section>`,
 `<section class="panel"><div class="panel-head"><h2>${s.join==='inner'?'INNER JOIN':'LEFT JOIN'} result</h2><span class="badge">${joined.length} rows</span></div>${table(['item_id','item_name','maker_id','maker'],joined.map(row=>[row.item_id,row.item_name,row.maker_id,row.maker]),{warning:row=>row[3]===null})}<p class="hint">${s.join==='inner'?'Only matching pairs appear. An orphan item has no matching maker and drops out.':'Every item remains. A missing maker produces NULL for columns on the right side.'}</p></section>${extra('keys-sql','SQL and constraint details',`<div class="code-example"><pre>SELECT i.item_id, i.item_name, i.maker_id, m.maker
FROM items AS i
${s.join==='inner'?'INNER':'LEFT'} JOIN makers AS m ON m.maker_id = i.maker_id
ORDER BY i.item_id;</pre></div><p class="compact">This model requires non-NULL maker IDs. A nullable foreign key can permit NULL in SQL; NOT NULL is a separate rule. The referenced maker_id is unique.</p>`)}`);
}

const NORMAL_FORMS=[{label:'Raw',title:'Repeating groups hide the relationship',description:'A list of jobs lives inside each employee row. Split each assignment into its own row.',dependency:['employee_id','list of job codes']},{label:'1NF',title:'One job assignment per row',description:'The composite key is (employee_id, job_code). Employee facts depend on employee_id alone; job names depend on job_code alone.',dependency:['employee_id + job_code','assignment row']},{label:'2NF',title:'Remove partial dependencies',description:'Employees, jobs, and assignments are separate. Employees still repeats the state name for everyone in the same state.',dependency:['employee_id','state_code','home_state']},{label:'3NF',title:'Remove the transitive dependency',description:'States owns the code-to-name relationship. Each employee stores a state code; a join supplies the state name.',dependency:['Employees.state_code','States.state_code']}];
function renderNormalization(){
 const s=states.normalization;
 put('#controls',`<h2>Compare the designs</h2><div class="radio-row" aria-label="Normal form">${[1,3].map(index=>`<button id="form-${index}" data-form="${index}" aria-pressed="${s.form===index}">${NORMAL_FORMS[index].label}</button>`).join('')}</div><p class="hint">Switching designs resets the move.</p><p id="move-destination" class="sample-row"></p><button class="primary" id="move-one">Move Alice #1</button>`);
 put('#advanced-controls',`<h2>More designs and updates</h2><div class="radio-row" aria-label="Other normal forms">${[0,2].map(index=>`<button id="form-${index}" data-form="${index}" aria-pressed="${s.form===index}">${NORMAL_FORMS[index].label}</button>`).join('')}</div><label class="field"><span>New state for Alice #1</span><select id="new-state">${STATES.map(state=>`<option value="${state.state_code}" ${s.target===state.state_code?'selected':''}>${state.home_state} · ${state.state_code}</option>`).join('')}</select></label><div class="activity-buttons">${s.form===1?'<button id="move-all">Update every Alice #1 row</button>':''}<button id="reset-move">Reset move</button></div><p class="compact">Alice #1 and Alice #3 are different people. Use employee_id to choose one.</p>`);
 const changeForm=event=>{const target=event.target.closest('[data-form]');if(target){const id=target.id;s.form=Number(target.dataset.form);s.update='none';renderNormalization();document.getElementById(id)?.focus({preventScroll:true});}};
 $('#controls').onclick=changeForm;$('#advanced-controls').onclick=changeForm;
 $('#new-state').onchange=()=>{s.target=Number($('#new-state').value);s.update='none';updateNormalization();};
 $('#move-one').onclick=()=>{s.update='first';updateNormalization();};
 $('#move-all')?.addEventListener('click',()=>{s.update='all';updateNormalization();});
 $('#reset-move').onclick=()=>{s.update='none';updateNormalization();};
 updateNormalization();
}
function updateNormalization(){
 const s=states.normalization,view=normalizationView(s.form,s.update,s.target),form=NORMAL_FORMS[s.form];
 $('#move-destination').textContent=`Alice #1 → ${STATES.find(state=>state.state_code===s.target).home_state}`;
 const status=view.anomaly?'Missed copy: Alice #1 now has two home states.':s.update==='none'?'Alice #1 lives in Michigan. Find every stored copy of that fact.':`${view.affected} stored row${view.affected===1?'':'s'} updated for Alice #1. Alice #3 is unchanged.`;
 const renderTable=data=>`<section class="table-card"><h3>${data.name}</h3><p class="key-note">Primary key: <code>${data.key}</code></p>${table(data.columns,data.rows,{highlight:row=>data.columns[0]==='employee_id'&&row[0]===1,warning:row=>view.anomaly&&row[0]===1})}</section>`;
 const primary=view.tables.filter((data,index)=>index===0||data.name==='States'),secondary=view.tables.filter(data=>!primary.includes(data));
 const compactTable=data=>{
  const columns=data.name==='States'?['state_code','home_state']:s.form===1?['employee_id','job_code','home_state']:s.form===3?['employee_id','name','state_code']:data.columns;
  const labels={employee_id:'Employee ID',job_code:'Job code',home_state:'Home state',state_code:'State code',name:'Name'};
  return `<section class="table-card"><h3>${data.name}</h3>${table(columns.map(column=>labels[column]??column),data.rows.map(row=>columns.map(column=>row[data.columns.indexOf(column)])),{highlight:row=>columns[0]==='employee_id'&&row[0]===1,warning:row=>view.anomaly&&row[0]===1})}</section>`;
 };
 result(`<div class="message ${view.anomaly?'error':'success'}" role="status">${status}</div><section class="panel"><div class="panel-head"><h2>${form.title}</h2><span class="badge">${form.label}</span></div><div class="normal-tables single">${primary.map(compactTable).join('')}</div>${s.form===1?'<p class="hint">Each row is identified by employee ID + job code. Move Alice #1 changes one row; watch the other copy.</p>':s.form===3?'<p class="hint">One employee row stores Alice’s state code; States supplies its name.</p>':''}</section>`,
 `${extra('normalization-full','All columns and primary keys',`<div class="normal-tables single">${primary.map(renderTable).join('')}</div>`)}${secondary.length?`<div class="normal-tables">${secondary.map(renderTable).join('')}</div>`:''}${s.form>=2?`<section class="panel"><div class="panel-head"><h2>Join the facts back together</h2><span class="badge">5 assignments</span></div>${table(['employee_id','name','job','home_state'],view.joined.map(row=>[row.employee_id,row.name,row.job,row.home_state]),{highlight:row=>row[0]===1})}</section>`:''}${extra('normalization-details','Why these normal forms?',`<p class="compact">${form.description}</p><div class="dependency">${form.dependency.map((part,index)=>`${index?'<b aria-hidden="true">→</b>':''}<span><code>${part}</code></span>`).join('')}</div><p class="compact">This example assumes employee_id → name, state_code; job_code → job; and state_code → home_state. Normal forms follow these dependencies. Keys let us reconstruct the original assignments.</p>`)}`);
}

function schemaHTML(schema){return `<p class="schema-head">${schema.tables.length} TABLES / VIEWS · FOREIGN KEYS ${schema.foreignKeys?'ON':'OFF'}</p>${schema.tables.map(item=>`<details class="schema-details" data-disclosure="schema-${esc(item.name)}"><summary>${esc(item.name)} <span class="hint" style="display:inline">${item.type==='view'?'· view':''}</span></summary>${item.columns.map(column=>`<p class="schema-column">${esc(column.name)} <span class="badge">${esc(column.type)||'expression'}</span>${column.primaryKey?' · PK':''}${column.notNull?' · NOT NULL':''}</p>`).join('')}<pre>${esc(item.sql??'')}</pre></details>`).join('')}`;}
function sqlResultsHTML(response){
 const {results=[],error}=response;
 return `${error?`<div class="message error" role="alert"><strong>SQLite error</strong><br>${esc(error)}<br><span class="hint">Later statements did not run. Earlier statements may already have changed this tab’s database.</span></div>`:''}${results.map((set,index)=>`<section class="panel"><div class="panel-head"><h3>Statement ${index+1}</h3><span class="badge">${set.columns.length?`${set.values.length}${set.truncated?'+':''} rows`:`${set.changes} changed rows`}</span></div>${set.columns.length?table(set.columns,set.values):'<p class="compact">Statement completed.</p>'}${set.truncated?'<p class="result-meta">Display limited to the first 200 rows. Add LIMIT to choose a smaller result.</p>':''}</section>`).join('')}${!results.length&&!error?'<div class="message">No statements to display.</div>':''}`;
}
function renderQueries(){
 const s=states.queries,generation=renderGeneration;
 put('#controls','');
 put('#advanced-controls',`<h2>Other queries</h2><label class="field"><span>Load an example</span><select id="query-example">${QUERY_EXAMPLES.map(example=>`<option value="${example.id}" ${s.example===example.id?'selected':''}>${esc(example.label)}</option>`).join('')}</select></label><button id="reset-data">Reset database</button><p class="hint">Reset restores the sample tables.</p>`);
 result(`<section class="panel"><div class="editor-heading"><h2>Your SQL</h2><span class="engine-badge" id="engine-version">SQLite · starting</span></div><label class="sr-only" for="sql-editor">SQL statements</label><textarea class="sql-editor" id="sql-editor" spellcheck="false" maxlength="50000">${esc(s.sql)}</textarea><div class="sql-buttons"><button class="primary" id="run-sql" disabled>Run SQL →</button><button id="cancel-sql" hidden>Stop query</button><span class="hint">Ctrl / ⌘ + Enter</span></div><p class="hint">Real SQLite. Changes stay in this tab until reset.</p></section><div id="query-output" class="sql-results" aria-live="polite"><div class="message">Loading the restaurant tables…</div></div>`,
 `<section class="panel"><h2>Database schema</h2><div id="q-schema"><p class="engine-loading">Loading local SQLite…</p></div></section>${extra('query-dialect','SQLite and MySQL details',`<p class="compact">The lecture uses MySQL; this sandbox runs SQLite. CREATE DATABASE, USE, DESCRIBE, and MySQL connector placeholders do not work here. Use the schema above or <code>PRAGMA table_info(employees)</code>. SELECT, INSERT, UPDATE, DELETE, and JOIN have dialect-specific details.</p><p class="compact">Multiple statements are allowed. Earlier changes can remain if a later statement fails. Stop query or an eight-second timeout discards this tab’s database; use Reset database to recover.</p>${source('https://www.sqlite.org/lang.html','SQLite SQL reference')}`)}`);
 client=createSQLClient('queries',()=>{s.ready=false;s.busy=false;if(generation===renderGeneration)setQueryBusy(false);});
 function setQueryBusy(busy){s.busy=busy;$('#run-sql').disabled=busy||!s.ready;$('#cancel-sql').hidden=!busy;$('#reset-data').disabled=busy;}
 async function initialize(reset=false){
   s.ready=false;setQueryBusy(true);
   try{const response=await client.request(reset?'reset':'init');if(generation!==renderGeneration)return;s.ready=true;put('#q-schema',schemaHTML(response.schema));$('#engine-version').textContent=`SQLite ${response.schema.version} · local`;$('#query-output').innerHTML='<div class="message success">Ready. Run the query above.</div>';}
   catch(error){if(generation===renderGeneration)$('#query-output').innerHTML=`<div class="message error" role="alert">${esc(error.message)} Use Reset database to retry.</div>`;}
   finally{if(generation===renderGeneration)setQueryBusy(false);}
 }
 async function run(){
   if(!s.ready||s.busy)return;s.sql=$('#sql-editor').value;setQueryBusy(true);$('#query-output').innerHTML='<div class="message">Running SQL locally…</div>';
   try{const response=await client.request('run',{sql:s.sql});if(generation!==renderGeneration)return;$('#query-output').innerHTML=sqlResultsHTML(response.result);put('#q-schema',schemaHTML(response.schema));}
   catch(error){if(generation===renderGeneration)$('#query-output').innerHTML=`<div class="message error" role="alert">${esc(error.message)}</div>`;}
   finally{if(generation===renderGeneration)setQueryBusy(false);}
 }
 $('#query-example').onchange=()=>{s.example=$('#query-example').value;s.sql=QUERY_EXAMPLES.find(example=>example.id===s.example).sql;$('#sql-editor').value=s.sql;$('#sql-editor').focus();};
 $('#sql-editor').oninput=()=>{s.sql=$('#sql-editor').value;};
 $('#sql-editor').onkeydown=event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();run();}};
 $('#run-sql').onclick=run;$('#cancel-sql').onclick=()=>client.cancel();$('#reset-data').onclick=()=>initialize(true);
 initialize();
}

function renderTransactions(){
 const s=states.transactions;
 put('#controls',`<h2>Follow the transfer</h2><p class="sample-row" id="transfer-plan"></p><div class="activity-buttons"><button class="primary" id="tx-next">1 · BEGIN</button><button id="tx-rollback" hidden>Roll back transfer</button></div>`);
 put('#advanced-controls',`<h2>Change the scenario</h2><label class="field"><span>Checking → savings · dollars</span><input id="transfer-amount" inputmode="decimal" value="${esc(s.amount)}" maxlength="12"></label><label class="check"><input id="fail-credit" type="checkbox" ${s.failCredit?'checked':''}>Fail the credit step</label><div class="activity-buttons"><button id="tx-reconnect">Reconnect model</button></div>${extra('transaction-actions','Individual transaction commands',`<div class="activity-buttons"><button id="tx-begin">1 · BEGIN</button><button id="tx-debit">2 · Debit checking</button><button id="tx-credit">3 · Credit savings</button><button id="tx-commit">4 · COMMIT</button></div><p class="compact">Amount and failure choice are captured at BEGIN. The model uses integer cents.</p>`)}`);
 $('#advanced-controls').oninput=()=>{s.amount=$('#transfer-amount').value;s.failCredit=$('#fail-credit').checked;updateTransactions();};
 const act=action=>{s.model=transferAction(s.model,action,{amount:parseCents(s.amount),failCredit:s.failCredit});updateTransactions();};
 $('#tx-next').onclick=()=>act(({begun:'debit',debited:'credit',credited:'commit'})[s.model.phase]??'begin');
 for(const action of ['begin','debit','credit','commit','rollback','reconnect'])$(`#tx-${action}`).onclick=()=>act(action);
 updateTransactions();
}
function money(cents){return `$${(cents/100).toFixed(2)}`;}
function balanceCard(title,balances,privateView=false){return `<div class="balance-card ${privateView?'private':''}"><h3>${title}</h3>${balances?`<div class="balance-row"><span>Checking</span><strong>${money(balances.checking)}</strong></div><div class="balance-row"><span>Savings</span><strong>${money(balances.savings)}</strong></div><div class="balance-total">Total: ${money(balances.checking+balances.savings)}</div>`:'<p class="empty">No active transaction.</p>'}</div>`;}
function updateTransactions(){
 const s=states.transactions,m=s.model;
 const amount=m.working?m.amount:parseCents(s.amount);
 $('#transfer-plan').textContent=`${amount===null?'Enter an amount':money(amount)} · Checking → Savings${s.failCredit?' · credit will fail':''}`;
 $('#tx-next').textContent=({begun:'2 · Debit checking',debited:'3 · Credit savings',credited:'4 · COMMIT'})[m.phase]??(m.phase==='idle'?'1 · BEGIN':'1 · Begin another transfer');
 $('#tx-rollback').hidden=!m.working;
 result(`${m.error?`<div class="message error" role="alert">${esc(m.error)}</div>`:''}<section class="panel"><div class="panel-head"><h2>Watch the balances</h2><span class="badge">${esc(m.phase)}</span></div><div class="split">${balanceCard('Committed · visible to another reader',m.committed)}${balanceCard('Private · this transfer',m.working,true)}</div><div class="transfer-flow">${[['begun','BEGIN'],['debited','debit'],['credited','credit'],['committed','COMMIT']].map(([phase,label])=>`<span class="${m.phase===phase?'active':''}">${label}</span>`).join('<span style="border:0;padding:8px 0" aria-hidden="true">→</span>')}</div><p class="hint">This model’s other reader sees only committed values.</p></section><div class="message ${m.error?'error':'success'}" role="status">${esc(m.log.at(-1)??'Begin the transfer, then compare the two views.')}</div>`,
 `<section class="panel"><h2>Execution log</h2>${m.log.length?`<ol class="trace">${m.log.map((entry,index)=>`<li class="${index===m.log.length-1?'current':''}"><span class="trace-index">${index+1}</span><span>${esc(entry)}</span></li>`).join('')}</ol>`:'<p class="empty">Begin a transfer to see its steps.</p>'}</section>${extra('transaction-details','ACID, SQL, and model details',`<div class="acids"><div class="acid"><strong>A</strong><small>Both changes commit together, or both are discarded.</small></div><div class="acid"><strong>C</strong><small>Checks enforce nonnegative balances and an unchanged total.</small></div><div class="acid"><strong>I</strong><small>This reader sees committed values.</small></div><div class="acid"><strong>D</strong><small>Model reconnect retains committed values.</small></div></div><div class="code-example"><pre>BEGIN;
UPDATE accounts SET balance_cents = balance_cents - ?
WHERE account_id = 'checking';
UPDATE accounts SET balance_cents = balance_cents + ?
WHERE account_id = 'savings';
COMMIT;
-- Application catches a failure and issues ROLLBACK.</pre></div><p class="compact">This is a transaction model, not a disk-durability test. An SQL statement error does not universally roll back the entire transaction by itself; this model’s application explicitly does so. Actual isolation depends on the database and isolation level. Reloading resets the experiment.</p>${source('https://www.sqlite.org/lang_transaction.html','SQLite transactions')}`)}`);
 $('#tx-begin').disabled=Boolean(m.working);$('#tx-debit').disabled=m.phase!=='begun';$('#tx-credit').disabled=m.phase!=='debited';$('#tx-commit').disabled=m.phase!=='credited';$('#tx-rollback').disabled=!m.working;$('#transfer-amount').disabled=Boolean(m.working);$('#fail-credit').disabled=Boolean(m.working);
}

function renderETL(){
 const s=states.etl,generation=renderGeneration;
 put('#controls',`<h2>Sample source</h2><label class="field"><span>JSON employee records · editable</span><textarea id="etl-json" class="etl-json" spellcheck="false" maxlength="60000">${esc(s.raw)}</textarea></label><button class="primary" id="load-batch" disabled>Load accepted rows →</button><p class="hint">Preview first. Loading writes the accepted rows.</p>`);
 put('#advanced-controls',`<h2>Cleaning rules</h2><label class="check"><input id="trim-names" type="checkbox" ${s.trimNames?'checked':''}>Trim names</label><label class="check"><input id="normalize-states" type="checkbox" ${s.normalizeStates?'checked':''}>Trim & uppercase state abbreviations</label><label class="field"><span>Duplicate IDs in this batch</span><select id="duplicate-policy"><option value="skip" ${s.duplicates==='skip'?'selected':''}>Keep first valid ID</option><option value="reject" ${s.duplicates==='reject'?'selected':''}>Block the whole batch</option></select></label><button id="reset-etl-db" disabled>Reset SQL table</button><p class="compact">Known states: MI = 26, WY = 56, VA = 51. Numeric state codes are accepted.</p>`);
 client=createSQLClient('etl',()=>{s.ready=false;s.busy=false;if(generation===renderGeneration)updateETL();});
 const input=()=>{s.raw=$('#etl-json').value;s.trimNames=$('#trim-names').checked;s.normalizeStates=$('#normalize-states').checked;s.duplicates=$('#duplicate-policy').value;updateETL();};
 $('#controls').oninput=input;$('#advanced-controls').oninput=input;
 async function initialize(reset=false){s.busy=true;updateETL();try{const response=await client.request(reset?'reset':'init');if(generation!==renderGeneration)return;s.ready=true;s.imported=response.imported;s.message=reset?'SQL table reset. The JSON source is unchanged.':'SQLite table ready. Inspect the preview, then load the accepted rows.';s.error=false;}catch(error){if(generation===renderGeneration){s.message=error.message;s.error=true;}}finally{if(generation===renderGeneration){s.busy=false;updateETL();}}}
 $('#load-batch').onclick=async()=>{
   const transformed=transformEmployees(s.raw,s);if(transformed.error||!s.ready||s.busy)return;s.busy=true;updateETL();
   try{const response=await client.request('load',{records:transformed.accepted});if(generation!==renderGeneration)return;s.imported=response.imported;s.error=Boolean(response.result.error);s.message=response.result.error?`Batch rolled back: ${response.result.error}. No rows from this load were kept.`:`Committed ${response.result.loaded} accepted rows with bound parameters.`;}
   catch(error){if(generation===renderGeneration){s.message=error.message;s.error=true;}}
   finally{if(generation===renderGeneration){s.busy=false;updateETL();}}
 };
 $('#reset-etl-db').onclick=()=>initialize(true);initialize();
}
function updateETL(){
 const s=states.etl,view=transformEmployees(s.raw,s);
 result(`<section class="panel"><div class="panel-head"><h2>JSON → accepted rows → SQL</h2><span class="badge">${s.busy?'Working…':s.ready?'SQLite ready':'Engine starting'}</span></div><div class="etl-flow"><div class="flow-node">Source<strong class="etl-count">${view.source.length}</strong><span class="sub">JSON records</span></div><div class="flow-node ${view.rejected.length?'orange':'active'}">Accepted<strong class="etl-count">${view.accepted.length}</strong><span class="sub">${view.rejected.length} rejected</span></div><div class="flow-node blue">Stored<strong class="etl-count">${s.imported.values.length}</strong><span class="sub">committed rows</span></div></div><div class="etl-tables"><div class="table-card"><h3>Accepted preview</h3>${table(['employee_id','name','state_code'],view.accepted.map(row=>[row.employee_id,row.name,row.state_code]))}</div><div class="table-card"><h3>Stored in SQL</h3>${table(s.imported.columns,s.imported.values)}</div></div><p class="hint">Each load commits all its accepted rows, or none.</p></section>${view.error?`<div class="message error" role="alert">${esc(view.error)}</div>`:''}<div class="message ${s.error?'error':'success'}" role="status">${esc(s.message)}</div>`,
 `${extra('etl-rejected','Rejected record details',view.rejected.length?`<ul class="etl-rejected">${view.rejected.map(item=>`<li><b>SOURCE ROW ${item.row}</b>${esc(item.reason)}</li>`).join('')}</ul>`:'<p class="compact">No rejected records.</p>')}${extra('etl-code','Bound inserts and batch rollback',`<div class="code-example"><pre># Python sqlite3 · all accepted rows in one transaction
with connection:
    connection.executemany(
        "INSERT INTO imported_employees "
        "(employee_id, name, state_code) VALUES (?, ?, ?)",
        [(r["employee_id"], r["name"], r["state_code"])
         for r in accepted]
    )</pre></div><p class="compact">The browser loader uses equivalent bound SQLite parameters. Names remain data even with apostrophes or SQL-looking text. MySQL Connector/Python uses <code>%s</code> instead of <code>?</code>; values still travel separately from SQL text.</p><p class="compact">A conflict with an already stored employee_id rolls back every row from that load. Accepted preview rows have not been written until Load succeeds.</p>`)}`);
 $('#load-batch').disabled=!s.ready||s.busy||Boolean(view.error)||view.accepted.length===0;$('#reset-etl-db').disabled=s.busy;
}
const renderers={keys:renderKeys,normalization:renderNormalization,queries:renderQueries,transactions:renderTransactions,etl:renderETL};
window.addEventListener('pagehide',()=>client?.close());
render();
