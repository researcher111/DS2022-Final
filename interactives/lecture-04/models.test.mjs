import test from 'node:test';
import assert from 'node:assert/strict';
import {pipeline,SAMPLE_DATA,commandLookup,inheritVariable,routeStreams,controlTrace,resolvePackages,environmentState,installEnvironment} from './models.mjs';

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
function env(){return {isolated:false,required:{a:'1.0',b:'2.0'},installed:{shared:resolvePackages('1.0'),a:null,b:null},locks:{a:null,b:null},newer:false};}
test('shared install changes both projects; isolated install leaves the other untouched',()=>{
  const shared=installEnvironment(env(),'b').state;
  assert.deepEqual(environmentState(shared).map(project=>project.ok),[false,true]);
  let isolated={...env(),isolated:true};
  isolated=installEnvironment(isolated,'a').state;isolated=installEnvironment(isolated,'b').state;
  assert.deepEqual(environmentState(isolated).map(project=>project.ok),[true,true]);
});
test('lock restores transitive versions after registry changes and rejects stale requirements',()=>{
  const state=env();state.isolated=true;state.locks.a=resolvePackages('1.0');state.newer=true;
  const fresh=installEnvironment(state,'a').state;
  assert.equal(fresh.installed.a.helper,'1.5');
  const locked=installEnvironment(fresh,'a',{locked:true}).state;
  assert.equal(locked.installed.a.helper,'1.4');
  assert.ok(installEnvironment(state,'b',{locked:true}).error);
  state.required.a='2.0';assert.ok(installEnvironment(state,'a',{locked:true}).error);
});
