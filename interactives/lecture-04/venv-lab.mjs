import {VENV_WORKFLOWS,virtualEnvironmentSnapshot,probeVirtualEnvironment} from './venv-model.mjs?v=20260917-venv-intro';

const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const appCode='import requests\n\nprint("requests is available")';
export function createVirtualEnvironmentDemo(){return {workflow:'project',step:0,target:'base',inspected:'code',exploring:false};}

export function renderVirtualEnvironment({state,controls,results,setResult}) {
  function renderControls(){
    const workflow=VENV_WORKFLOWS[state.workflow],last=state.exploring||state.step>3?workflow.steps.length-1:3;
    controls.innerHTML=`<h2>One command at a time</h2><p class="guided-progress">${state.workflow==='project'?'uv project':'Standalone environment'} · ${state.step+1} / ${last+1}</p><div class="guided-actions"><button id="venv-next" class="primary" ${state.step>=last?'disabled':''}>Next command →</button><button id="venv-back" ${state.step===0?'disabled':''}>← Back</button></div><details class="explore" id="venv-options" ${state.exploring?'open':''}><summary>Explore more</summary><label class="field"><span>Workflow</span><select id="venv-workflow"><option value="project" ${state.workflow==='project'?'selected':''}>Project: init → add → run</option><option value="bare" ${state.workflow==='bare'?'selected':''}>Environment only: uv venv</option></select></label><label class="field"><span>Compare another Python</span><select id="venv-target"><option value="base" ${state.target==='base'?'selected':''}>Base Python</option><option value="venv" ${state.target==='venv'?'selected':''}>The .venv Python</option><option value="shell" ${state.target==='shell'?'selected':''}>This terminal’s python</option></select></label><h3>Jump to a step</h3><ol class="venv-steps">${workflow.steps.map((step,index)=>`<li><button id="venv-step-${index}" data-venv-step="${index}" ${index===state.step?'aria-current="step"':''}><span>${index+1}</span>${esc(step.title)}</button></li>`).join('')}</ol><p class="hint">Try activation and deactivation in the environment-only workflow, or removal and rebuilding in the project workflow.</p></details>`;
    controls.querySelector('#venv-options').ontoggle=event=>{
      state.exploring=event.target.open;
      const limit=state.exploring||state.step>3?workflow.steps.length-1:3;
      controls.querySelector('#venv-next').disabled=state.step>=limit;
      controls.querySelector('.guided-progress').textContent=`${state.workflow==='project'?'uv project':'Standalone environment'} · ${state.step+1} / ${limit+1}`;
    };
    controls.onchange=event=>{
      if(event.target.id==='venv-workflow'){state.workflow=event.target.value;state.step=0;state.target='base';renderControls();update();}
      if(event.target.id==='venv-target'){state.target=event.target.value;update();}
    };
    controls.onclick=event=>{
      const jump=event.target.closest('[data-venv-step]');
      const next=jump?Number(jump.dataset.venvStep):event.target.closest('#venv-next')?state.step+1:event.target.closest('#venv-back')?state.step-1:null;
      if(next===null)return;
      state.step=Math.max(0,Math.min(workflow.steps.length-1,next));
      const snapshot=virtualEnvironmentSnapshot(state.workflow,state.step);
      state.target=snapshot.activated?'shell':snapshot.hasEnvironment?'venv':'base';
      const focused=event.target.closest('button')?.id;
      renderControls();update();
      if(focused)document.getElementById(focused)?.focus({preventScroll:true});
    };
  }
  function inspector(snapshot){
    const panels={
      base:{title:'Base Python',body:'The base installation supplies the interpreter and standard library. By default, a virtual environment does not inherit its third-party packages.'},
      code:{title:'Your source file stays outside .venv',body:'The highlighted import loads requests. Installing packages changes the environment, not app.py. Rebuilding .venv leaves your source file in place.'},
      environment:{title:'What .venv contains',body:'A Python entry point, environment configuration, and a separate third-party package directory. It is not another computer or operating system.'},
      python:{title:'The environment’s Python',body:'bin/python is a copy or link to a Python executable. Using it selects this environment’s package directory; the standard library comes from the base installation.'},
      packages:{title:'Installed packages',body:snapshot.hasRequests?'requests and its dependencies are installed here. The base Python and other project environments do not gain them automatically.':'Creating .venv does not install requests. Add the package before running code that imports it.'}
    };
    const selected=panels[state.inspected]||panels.code;
    return `<div class="venv-inspector"><h3>${selected.title}</h3><p>${selected.body}</p></div>`;
  }
  function update(){
    const snapshot=virtualEnvironmentSnapshot(state.workflow,state.step),probe=probeVirtualEnvironment(snapshot,state.target),selectedVenv=probe.interpreter.includes('/.venv/');
    const inspectButton=(key,label,extra='')=>`<button class="venv-node ${state.inspected===key?'inspected':''} ${extra}" data-venv-inspect="${key}" aria-pressed="${state.inspected===key}">${label}</button>`;
    setResult(`<section class="panel primary-result venv-diagram-panel"><div class="panel-head"><h2>${esc(snapshot.title)}</h2><span class="badge">Simulation</span></div><div class="terminal venv-current-command"><pre>${esc(snapshot.command)}</pre></div><div class="venv-map"><div class="venv-base">${inspectButton('base','<strong>Base Python</strong><span>Python 3.11</span><small>No requests here</small>',!selectedVenv?'chosen':'')}<div class="venv-link" aria-hidden="true">${snapshot.hasEnvironment?'Creates the environment →':'Create an environment →'}</div></div><div class="venv-project"><div class="venv-project-heading"><strong>demo/</strong><span>Your project</span></div><section class="venv-sample-file" aria-label="Sample Python file"><div class="venv-sample-header"><button data-venv-inspect="code" aria-pressed="${state.inspected==='code'}"><code>app.py</code></button><a href="../../examples/lecture-04/venv-demo/app.py" download="app.py">Download</a></div><pre><code><mark class="venv-import-line">${esc(appCode.split('\n')[0])}</mark>${esc(appCode.slice(appCode.indexOf('\n')))}</code></pre></section><div class="venv-boundary ${snapshot.hasEnvironment?'exists':'absent'}">${inspectButton('environment',`<strong>.venv/</strong><span>${snapshot.hasEnvironment?'Virtual environment':'Not created yet'}</span>`)}${snapshot.hasEnvironment?`${inspectButton('python','<code>bin/python</code>',selectedVenv?'chosen':'')}${inspectButton('packages',`<span>Packages</span><strong>${snapshot.hasRequests?'requests':'Empty'}</strong>`,snapshot.hasRequests?'has-packages':'')}`:''}</div></div></div><div class="venv-probe"><div class="panel-head"><h3>Import check · ${selectedVenv?'.venv Python':'Base Python'}</h3><span class="badge ${probe.success?'':'error'}">${probe.success?'Works':probe.available?'Package missing':'Environment missing'}</span></div><div class="terminal"><pre>${esc(probe.command)}\n${esc(probe.output)}</pre></div></div><details class="explore" id="venv-details"><summary>How it works · inspect the diagram</summary><p>${esc(snapshot.explanation)}</p>${inspector(snapshot)}<h3 class="result-label">Files at this step</h3><pre>${esc(snapshot.files.join('\n'))}${snapshot.hasEnvironment?'\n\nInside .venv:\n'+esc(snapshot.venvFiles.join('\n')):''}</pre><p>${state.workflow==='project'?'pyproject.toml declares dependencies; uv.lock records resolved versions. Keep them with your source so uv can rebuild .venv.':'uv venv creates an environment; uv pip install changes its packages. These commands do not create project metadata or a uv.lock.'}</p><p>This terminal is ${snapshot.activated?'activated: .venv/bin is first in PATH.':'not activated: its ordinary python command uses the base installation in this example.'} Activation changes lookup; it does not install or remove packages.</p><p class="hint">Bash / Zsh on macOS, Linux, or WSL. Start in a fresh practice folder with the sample app.py, Python 3.11, and uv available. Paths are illustrative. Import checks do not install packages.</p><p class="source-link">References: <a href="https://docs.python.org/3/library/venv.html" target="_blank" rel="noopener">Python venv ↗</a> · <a href="https://docs.astral.sh/uv/pip/environments/" target="_blank" rel="noopener">uv environments ↗</a> · <a href="https://docs.astral.sh/uv/guides/projects/" target="_blank" rel="noopener">uv projects ↗</a></p></details></section><p class="next-activity"><a href="?activity=environments">Next: solve a dependency conflict →</a></p>`);
    results.onclick=event=>{const button=event.target.closest('[data-venv-inspect]');if(!button)return;state.inspected=button.dataset.venvInspect;update();results.querySelector('#venv-details').open=true;results.querySelector(`[data-venv-inspect="${state.inspected}"]`)?.focus({preventScroll:true});};
  }
  renderControls();update();
}
