import test from 'node:test';
import assert from 'node:assert/strict';
import {pipeline,SAMPLE_DATA,commandLookup,inheritVariable,routeStreams,controlTrace,ENV_PROJECTS,createEnvironmentState,resolvePackages,protobufCompatibility,environmentState,installEnvironment} from './models.mjs';

test('pipeline normalizes before deduplication; validates range and missing scores',()=>{
  const result=pipeline(SAMPLE_DATA);
  assert.deepEqual(result.stages.map(rows=>rows.length),[7,7,4,3,3]);
  assert.equal(result.text,'ada,91\nbob,82\neli,73');
  assert.equal(pipeline(SAMPLE_DATA,{normalize:false}).rows.length,4);
  assert.equal(pipeline(SAMPLE_DATA,{filter:true,minimum:80}).text,'ada,91\nbob,82');
});
test('pipeline handles malformed records, empty input, and filter boundaries',()=>{
  assert.equal(pipeline('').rows.length,0);
  assert.equal(pipeline('Ada,80\n,0\nBob,0\nEve,Infinity\nRay,90,extra',{filter:true,minimum:80}).text,'ada,80');
  assert.equal(pipeline('A,0\nB,100\nC,101\nD,-1').rows.length,2);
});
test('pipeline treats text as data without executing markup',()=>{
  assert.equal(pipeline('<script>alert(1)</script>,90').rows[0].name,'<script>alert(1)</script>');
});
test('command lookup selects the first executable and skips later folders',()=>{
  const directories=[{path:'/a',commands:{python:{executable:false}}},{path:'/b',commands:{python:{executable:true,version:'B'}}},{path:'/c',commands:{python:{executable:true,version:'C'}}}];
  assert.equal(commandLookup(directories,'python').path,'/b/python');
  assert.equal(commandLookup(directories,'python').searched[2].state,'not searched');
  assert.equal(commandLookup([...directories].reverse(),'python').path,'/c/python');
  assert.equal(commandLookup(directories,'missing').status,127);
});
test('only exported variables reach a newly launched child',()=>{
  assert.equal(inheritVariable('cat',false).child,null);
  assert.equal(inheritVariable('cat',true).child,'cat');
  assert.equal(inheritVariable('cat',false).parent,'cat');
  assert.equal(inheritVariable('',true).child,'');
});
test('replace truncates even with no output; append retains exact bytes across runs',()=>{
  assert.equal(routeStreams({mode:'replace',file:'old\n',stdout:'',stderr:''}).file,'');
  const first=routeStreams({mode:'append',file:'old\n',stdout:'new\n',stderr:'err\n'});
  assert.equal(first.file,'old\nnew\n');assert.equal(first.terminal,'err\n');
  assert.equal(routeStreams({mode:'append',file:first.file,stdout:'new\n',stderr:''}).file,'old\nnew\nnew\n');
});
test('redirect order copies the destination at that point, not a dynamic pointer',()=>{
  const settings={stdout:'data\n',stderr:'err\n',file:'old\n'};
  assert.equal(routeStreams({...settings,mode:'combined'}).file,'data\nerr\n');
  const reverse=routeStreams({...settings,mode:'order'});
  assert.equal(reverse.file,'data\n');assert.equal(reverse.terminal,'err\n');
});
test('a pipe receives only stdout unless stderr is explicitly merged',()=>{
  const settings={stdout:'Ada,91\nBob,82\n',stderr:'Ada warning\n',pattern:'Ada'};
  const normal=routeStreams({...settings,mode:'pipe'});
  assert.equal(normal.pipe,settings.stdout);assert.equal(normal.filtered,'Ada,91\n');assert.equal(normal.terminal,'Ada warning\nAda,91\n');
  const merged=routeStreams({...settings,mode:'mergedPipe'});
  assert.equal(merged.filtered,'Ada,91\nAda warning\n');
  assert.equal(routeStreams({...settings,mode:'pipe',pattern:'ZZZ'}).filterStatus,1);
  assert.equal(routeStreams({...settings,mode:'pipe',pattern:''}).filtered,settings.stdout);
  assert.equal(routeStreams({mode:'pipe',stdout:'',stderr:'',pattern:''}).filterStatus,1);
  assert.equal(routeStreams({mode:'pipe',stdout:'Ada',stderr:'',pattern:'Ada'}).filtered,'Ada\n');
});
test('conditionals run exactly one branch; empty loops never execute a body',()=>{
  assert.deepEqual(controlTrace({exists:false}).map(step=>step.node),['test','false','done']);
  assert.equal(controlTrace({mode:'loop',names:[]}).some(step=>step.node==='body'),false);
  const names=['Ada Lovelace','Bob'];
  assert.equal(controlTrace({mode:'loop',names}).filter(step=>step.node==='body').map(step=>step.output).join(''),'Name: Ada Lovelace\nName: Bob\n');
});
test('AND, OR, and sequential lists keep the status of the last executed command',()=>{
  for(const first of [0,1,2])for(const second of [0,1,2])for(const operator of ['&&','||',';']){
    const trace=controlTrace({mode:'chain',operator,first,second});
    const runs=operator===';'||(operator==='&&'?first===0:first!==0);
    assert.equal(trace.some(step=>step.node==='second'),runs);
    assert.equal(trace.at(-1).output,`${runs?second:first}\n`);
  }
});
test('protobuf ranges are disjoint and compare numeric version components',()=>{
  for (const [version,expected] of [
    ['3.99.99',{a:false,b:false}],['4.0.0',{a:true,b:false}],
    ['4.25.3',{a:true,b:false}],['4.99.99',{a:true,b:false}],
    ['5',{a:false,b:false}],['6.33.4',{a:false,b:false}],
    ['6.33.5',{a:false,b:true}],['6.33.10',{a:false,b:true}],
    ['7',{a:false,b:true}],['7.99.99',{a:false,b:true}],
    ['8',{a:false,b:false}],['10.0.0',{a:false,b:false}],
    ['',{a:false,b:false}],['6.33.5rc1',{a:false,b:false}]
  ]) assert.deepEqual(protobufCompatibility(version),expected,version);
});
test('environment reset starts empty and each project resolves its real pinned packages',()=>{
  assert.deepEqual(createEnvironmentState(),{isolated:false,installed:{shared:null,a:null,b:null},locks:{shared:null,a:null,b:null}});
  assert.deepEqual(resolvePackages('a'),{'dbt-core':'1.7.14',protobuf:'4.25.8'});
  assert.deepEqual(resolvePackages('b'),{'google-cloud-pubsub':'2.40.0',protobuf:'6.33.5'});
  assert.equal(ENV_PROJECTS.a.spec,'dbt-core==1.7.14');
  assert.equal(ENV_PROJECTS.b.spec,'google-cloud-pubsub==2.40.0');
  const empty = environmentState(createEnvironmentState());
  assert.deepEqual(empty.map(project=>project.missing),[true,true]);
  assert.deepEqual(empty.map(project=>project.ok),[false,false]);
});
test('shared resolution rejects disjoint requirements and preserves install and lock in either order',()=>{
  for (const [first,second] of [['a','b'],['b','a']]) {
    const successful = installEnvironment(createEnvironmentState(),first);
    assert.equal(successful.error,null);
    const state = successful.state;
    const before = JSON.parse(JSON.stringify(state));
    assert.deepEqual(state.installed.shared,resolvePackages(first));
    assert.deepEqual(state.locks.shared,resolvePackages(first));
    const rejected = installEnvironment(state,second);
    assert.match(rejected.error,/No solution/);
    assert.strictEqual(rejected.state,state);
    assert.deepEqual(state,before);
    const projects = environmentState(state);
    assert.equal(projects.find(project=>project.project===first).ok,true);
    assert.equal(projects.find(project=>project.project===second).missing,true);
    assert.equal(projects.find(project=>project.project===second).ok,false);
  }
});
test('shared requirements survive environment deletion through the saved lock',()=>{
  const installed = installEnvironment(createEnvironmentState(),'a').state;
  const deleted = {...installed,installed:{...installed.installed,shared:null}};
  const rejected = installEnvironment(deleted,'b');
  assert.match(rejected.error,/No solution/);
  assert.strictEqual(rejected.state,deleted);
  const restored = installEnvironment(deleted,'a',{locked:true});
  assert.equal(restored.error,null);
  assert.deepEqual(restored.state.installed.shared,installed.locks.shared);
});
test('isolated additions and automatic locks are independent',()=>{
  const initial = {...createEnvironmentState(),isolated:true};
  const first = installEnvironment(initial,'a').state;
  const before = JSON.parse(JSON.stringify(first));
  const second = installEnvironment(first,'b').state;
  assert.deepEqual(second.installed.a,resolvePackages('a'));
  assert.deepEqual(second.installed.b,resolvePackages('b'));
  assert.deepEqual(second.locks.a,resolvePackages('a'));
  assert.deepEqual(second.locks.b,resolvePackages('b'));
  assert.equal(second.installed.shared,null);
  assert.deepEqual(environmentState(second).map(project=>project.ok),[true,true]);
  assert.deepEqual(first,before);
});
test('repeat additions prefer a compatible saved lock and keep exact transitive versions',()=>{
  const initial = installEnvironment(createEnvironmentState(),'a').state;
  const pinned = {...initial,locks:{...initial.locks,shared:{'dbt-core':'1.7.14',protobuf:'4.25.3'}}};
  const repeated = installEnvironment(pinned,'a');
  assert.equal(repeated.error,null);
  assert.deepEqual(repeated.state.installed.shared,pinned.locks.shared);
  assert.equal(repeated.state.locks.shared.protobuf,'4.25.3');
  assert.notStrictEqual(repeated.state.installed.shared,repeated.state.locks.shared);
});
test('locked sync recreates a deleted isolated environment without changing either lock',()=>{
  let state = {...createEnvironmentState(),isolated:true};
  state = installEnvironment(state,'a').state;
  state = installEnvironment(state,'b').state;
  const deleted = {...state,installed:{...state.installed,a:null}};
  const rebuilt = installEnvironment(deleted,'a',{locked:true});
  assert.equal(rebuilt.error,null);
  assert.deepEqual(rebuilt.state.installed.a,state.locks.a);
  assert.deepEqual(rebuilt.state.installed.b,state.installed.b);
  assert.deepEqual(rebuilt.state.locks,state.locks);
  assert.notStrictEqual(rebuilt.state.installed.a,rebuilt.state.locks.a);
  assert.equal(deleted.installed.a,null);
});
test('locked sync requires a matching direct requirement and compatible dependency',()=>{
  const empty = createEnvironmentState();
  assert.match(installEnvironment(empty,'a',{locked:true}).error,/No saved lock/);
  const installed = installEnvironment(empty,'a').state;
  assert.match(installEnvironment(installed,'b',{locked:true}).error,/does not match/);
  for (const packages of [
    {'dbt-core':'1.7.13',protobuf:'4.25.3'},
    {'dbt-core':'1.7.14',protobuf:'6.33.5'},
    {'dbt-core':'1.7.14','google-cloud-pubsub':'2.40.0',protobuf:'4.25.3'}
  ]) {
    const stale = {...empty,locks:{...empty.locks,shared:packages}};
    const rejected = installEnvironment(stale,'a',{locked:true});
    assert.match(rejected.error,/does not match/);
    assert.strictEqual(rejected.state,stale);
  }
});
test('environment operations are deterministic and do not mutate their inputs',()=>{
  const state = Object.freeze({isolated:false,installed:Object.freeze({shared:null,a:null,b:null}),locks:Object.freeze({shared:null,a:null,b:null})});
  const first = installEnvironment(state,'a');
  assert.deepEqual(first,installEnvironment(state,'a'));
  assert.deepEqual(state,createEnvironmentState());
  assert.notStrictEqual(first.state.installed.shared,first.state.locks.shared);
  const copy = resolvePackages('a');copy.protobuf='5.0.0';
  assert.equal(resolvePackages('a').protobuf,'4.25.8');
  const reset = createEnvironmentState();reset.installed.shared=copy;
  assert.equal(createEnvironmentState().installed.shared,null);
});
