import test from 'node:test';
import assert from 'node:assert/strict';
import {VENV_WORKFLOWS,virtualEnvironmentSnapshot,probeVirtualEnvironment} from './venv-model.mjs';

test('project initialization creates metadata before an environment or a lock',()=>{
  const start = virtualEnvironmentSnapshot('project',0);
  assert.deepEqual(start.files,['app.py']);
  const initialized = virtualEnvironmentSnapshot('project',1);
  assert.equal(initialized.command,'uv init --no-package --python 3.11');
  assert.equal(initialized.hasProject,true);
  assert.equal(initialized.hasEnvironment,false);
  assert.equal(initialized.hasRequests,false);
  assert.equal(initialized.hasLock,false);
  assert.deepEqual(initialized.files,['app.py','pyproject.toml','.python-version']);
  assert.deepEqual(initialized.venvFiles,[]);
  const added = virtualEnvironmentSnapshot('project',2);
  assert.equal(added.hasEnvironment,true);
  assert.equal(added.hasRequests,true);
  assert.equal(added.hasLock,true);
  assert.ok(added.files.includes('uv.lock'));
  assert.ok(added.venvFiles.includes('lib/python3.11/site-packages/requests/'));
});

test('uv run uses project packages without activating the calling shell',()=>{
  const run = virtualEnvironmentSnapshot('project',3);
  assert.equal(run.running,true);
  assert.equal(run.activated,false);
  assert.equal(run.command,'uv run app.py');
  assert.equal(probeVirtualEnvironment(run,'venv').success,true);
  assert.equal(probeVirtualEnvironment(run,'shell').success,false);
  assert.equal(probeVirtualEnvironment(run,'shell').interpreter,'/opt/python/bin/python3');
});

test('removing and rebuilding .venv preserves project files and lock',()=>{
  const installed = virtualEnvironmentSnapshot('project',2);
  const removed = virtualEnvironmentSnapshot('project',4);
  const rebuilt = virtualEnvironmentSnapshot('project',5);
  assert.equal(removed.hasEnvironment,false);
  assert.equal(removed.hasRequests,false);
  assert.equal(removed.hasProject,true);
  assert.equal(removed.hasLock,true);
  assert.equal(removed.files.includes('.venv/'),false);
  assert.deepEqual(removed.files,installed.files.filter(file=>file!=='.venv/'));
  assert.deepEqual(removed.venvFiles,[]);
  assert.equal(rebuilt.command,'uv sync --locked');
  assert.deepEqual(rebuilt.files,installed.files);
  assert.deepEqual(rebuilt.venvFiles,installed.venvFiles);
  assert.equal(probeVirtualEnvironment(rebuilt,'venv').success,true);
  assert.equal(rebuilt.activated,false);
});

test('the standalone workflow never creates project metadata or a project lock',()=>{
  for (let step=0; step<6; step+=1) {
    const state = virtualEnvironmentSnapshot('bare',step);
    assert.equal(state.hasProject,false);
    assert.equal(state.hasLock,false);
    assert.equal(state.files.includes('pyproject.toml'),false);
    assert.equal(state.files.includes('.python-version'),false);
    assert.equal(state.files.includes('uv.lock'),false);
    assert.ok(state.files.includes('app.py'));
  }
  const created = virtualEnvironmentSnapshot('bare',1);
  assert.equal(created.hasEnvironment,true);
  assert.equal(created.hasRequests,false);
  assert.ok(created.venvFiles.includes('pyvenv.cfg'));
  assert.ok(created.venvFiles.includes('lib/python3.11/site-packages/'));
  assert.equal(created.venvFiles.some(file=>file.endsWith('/requests/')),false);
  const installed = virtualEnvironmentSnapshot('bare',2);
  assert.equal(installed.activated,false);
  assert.equal(installed.hasRequests,true);
  assert.equal(installed.command,'uv pip install requests');
  assert.equal(probeVirtualEnvironment(installed,'venv').success,true);
});

test('explicit interpreter selection works before activation',()=>{
  const state = virtualEnvironmentSnapshot('bare',3);
  assert.equal(state.running,true);
  assert.equal(state.activated,false);
  assert.equal(state.command,'.venv/bin/python app.py');
  const explicit = probeVirtualEnvironment(state,'venv');
  assert.equal(explicit.interpreter,'/home/student/demo/.venv/bin/python');
  assert.equal(explicit.success,true);
  assert.equal(explicit.output,'requests is available\n');
  assert.equal(probeVirtualEnvironment(state,'shell').success,false);
});

test('activation and deactivation only change shell interpreter selection',()=>{
  const before = virtualEnvironmentSnapshot('bare',3);
  const active = virtualEnvironmentSnapshot('bare',4);
  const after = virtualEnvironmentSnapshot('bare',5);
  assert.equal(active.activated,true);
  assert.equal(after.activated,false);
  assert.equal(active.running,false);
  assert.equal(after.running,false);
  for (const state of [active,after]) {
    assert.deepEqual(state.files,before.files);
    assert.deepEqual(state.venvFiles,before.venvFiles);
    assert.equal(state.hasRequests,true);
    assert.equal(probeVirtualEnvironment(state,'venv').success,true);
    assert.equal(probeVirtualEnvironment(state,'base').success,false);
  }
  assert.equal(probeVirtualEnvironment(active,'shell').interpreter,'/home/student/demo/.venv/bin/python');
  assert.equal(probeVirtualEnvironment(active,'shell').command,'python app.py');
  assert.equal(probeVirtualEnvironment(active,'shell').success,true);
  assert.equal(probeVirtualEnvironment(after,'shell').interpreter,'/opt/python/bin/python3');
  assert.equal(probeVirtualEnvironment(after,'shell').success,false);
});

test('probes distinguish an absent interpreter from a missing package',()=>{
  const absent = virtualEnvironmentSnapshot('bare',0);
  const empty = virtualEnvironmentSnapshot('bare',1);
  const missingInterpreter = probeVirtualEnvironment(absent,'venv');
  assert.equal(missingInterpreter.available,false);
  assert.equal(missingInterpreter.success,false);
  assert.match(missingInterpreter.output,/No such file/);
  const missingPackage = probeVirtualEnvironment(empty,'venv');
  assert.equal(missingPackage.available,true);
  assert.equal(missingPackage.success,false);
  assert.match(missingPackage.output,/ModuleNotFoundError/);
  assert.match(probeVirtualEnvironment(absent,'base').output,/ModuleNotFoundError/);
  assert.equal(probeVirtualEnvironment(absent,'base').command,'/opt/python/bin/python3 app.py');
});

test('invalid workflows, steps, probe targets and inconsistent states fail explicitly',()=>{
  for (const name of ['unknown','constructor','__proto__',null,undefined]) {
    assert.throws(()=>virtualEnvironmentSnapshot(name,0),RangeError);
  }
  for (const step of [-1,6,1.5,'2',NaN,Infinity,null,undefined]) {
    assert.throws(()=>virtualEnvironmentSnapshot('project',step),RangeError);
  }
  const state = virtualEnvironmentSnapshot('bare',2);
  assert.throws(()=>probeVirtualEnvironment(state,'system'),RangeError);
  assert.throws(()=>probeVirtualEnvironment(null,'shell'),RangeError);
  assert.throws(()=>probeVirtualEnvironment({...state,activated:true},'shell'),RangeError);
  assert.throws(()=>probeVirtualEnvironment({...state,hasRequests:false},'venv'),RangeError);
});

test('snapshots and probes are deterministic and do not mutate workflow definitions or input',()=>{
  const state = virtualEnvironmentSnapshot('project',4);
  Object.freeze(state.files);Object.freeze(state.venvFiles);Object.freeze(state);
  const probe = probeVirtualEnvironment(state,'venv');
  assert.deepEqual(probe,probeVirtualEnvironment(state,'venv'));
  assert.deepEqual(state,virtualEnvironmentSnapshot('project',4));
  assert.equal(state.hasEnvironment,false);
  const changed = virtualEnvironmentSnapshot('bare',2);
  changed.files.push('unrelated.txt');changed.venvFiles.length=0;
  const fresh = virtualEnvironmentSnapshot('bare',2);
  assert.equal(fresh.files.includes('unrelated.txt'),false);
  assert.ok(fresh.venvFiles.includes('lib/python3.11/site-packages/requests/'));
  assert.equal(Object.isFrozen(VENV_WORKFLOWS.project.steps[1]),true);
  assert.equal(VENV_WORKFLOWS.project.steps.length,6);
  assert.equal(VENV_WORKFLOWS.bare.steps.length,6);
});
