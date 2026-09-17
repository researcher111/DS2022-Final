// Deterministic classroom model. These functions never execute a command,
// inspect the machine, resolve live packages, or change the filesystem.
// The file lists show key teaching files, not a complete uv directory listing.

function workflow(label,steps) {
  return Object.freeze({label,steps:Object.freeze(steps.map(step=>Object.freeze(step)))});
}

export const VENV_WORKFLOWS = Object.freeze({
  project:workflow('uv project workflow',[
    {
      title:'Start with a Python file',
      command:'# Start in /home/student/demo with app.py',
      explanation:'The supplied app.py imports requests and prints a message. The base Python in this example does not have requests installed.'
    },
    {
      title:'Create project metadata',
      command:'uv init --no-package --python 3.11',
      explanation:'uv initializes project metadata and records the Python version. It has not created .venv or installed requests yet.'
    },
    {
      title:'Add a project dependency',
      command:'uv add requests',
      explanation:'uv records requests in pyproject.toml, resolves dependencies into uv.lock, and creates and installs packages into the project’s .venv.'
    },
    {
      title:'Run with the project Python',
      command:'uv run app.py',
      explanation:'uv uses the project environment to run app.py. This command does not require activating .venv in the shell.'
    },
    {
      title:'Remove the environment in the simulation',
      command:'# .venv removed in this simulation',
      explanation:'The .venv directory is gone. app.py, project metadata, and uv.lock remain, so the package selection can be rebuilt.'
    },
    {
      title:'Rebuild from the lock',
      command:'uv sync --locked',
      explanation:'uv recreates .venv and installs the locked packages. --locked requires uv.lock to match the project metadata and prevents re-resolving a changed project.'
    }
  ]),
  bare:workflow('Standalone .venv',[
    {
      title:'Start with a Python file',
      command:'# Start in /home/student/demo with app.py',
      explanation:'The supplied app.py imports requests. This workflow creates a standalone environment without uv project metadata or a project lock.'
    },
    {
      title:'Create the virtual environment',
      command:'uv venv --python 3.11',
      explanation:'uv creates .venv with a Python interpreter and its own site-packages directory. requests is not installed.'
    },
    {
      title:'Install into the nearby environment',
      command:'uv pip install requests',
      explanation:'With no other virtual or Conda environment active, uv discovers .venv in the current directory. It installs requests and its dependencies without creating pyproject.toml or uv.lock.'
    },
    {
      title:'Choose the interpreter explicitly',
      command:'.venv/bin/python app.py',
      explanation:'An explicit interpreter path runs app.py with the packages in .venv. The shell itself is still using its original PATH.'
    },
    {
      title:'Activate in this shell',
      command:'source .venv/bin/activate',
      explanation:'Activation puts .venv/bin at the front of this shell’s PATH, so python selects the environment. It does not install or copy packages.'
    },
    {
      title:'Return to the original shell lookup',
      command:'deactivate',
      explanation:'Deactivation restores the shell’s previous PATH. The .venv directory and its installed packages remain available through the explicit interpreter path.'
    }
  ])
});

const BASE_PYTHON = '/opt/python/bin/python3';
const VENV_PYTHON = '/home/student/demo/.venv/bin/python';
const SITE_PACKAGES = 'lib/python3.11/site-packages/';
const INSTALLED_PACKAGE_DIRECTORIES = Object.freeze([
  'requests/','urllib3/','certifi/','charset_normalizer/','idna/'
]);

export function virtualEnvironmentSnapshot(workflowName,step) {
  if (!Object.hasOwn(VENV_WORKFLOWS,workflowName)) throw new RangeError('Workflow must be "project" or "bare".');
  if (!Number.isInteger(step) || step < 0 || step >= VENV_WORKFLOWS[workflowName].steps.length) {
    throw new RangeError('Step must be an integer from 0 through 5.');
  }
  const managed = workflowName === 'project';
  const hasProject = managed && step >= 1;
  const hasEnvironment = managed ? step >= 2 && step !== 4 : step >= 1;
  const hasRequests = hasEnvironment && step >= 2;
  const hasLock = managed && step >= 2;
  const activated = !managed && step === 4;
  const running = step === 3;
  const files = ['app.py'];
  if (hasProject) files.push('pyproject.toml','.python-version');
  if (hasLock) files.push('uv.lock');
  if (hasEnvironment) files.push('.venv/');
  const venvFiles = hasEnvironment ? ['bin/python','bin/activate','pyvenv.cfg',SITE_PACKAGES] : [];
  if (hasRequests) venvFiles.push(...INSTALLED_PACKAGE_DIRECTORIES.map(directory=>SITE_PACKAGES+directory));
  return {
    workflow:workflowName,step,...VENV_WORKFLOWS[workflowName].steps[step],
    hasProject,hasEnvironment,hasRequests,hasLock,activated,running,files,venvFiles
  };
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new RangeError('A virtual environment snapshot is required.');
  const expected = virtualEnvironmentSnapshot(snapshot.workflow,snapshot.step);
  for (const key of ['hasProject','hasEnvironment','hasRequests','hasLock','activated','running']) {
    if (snapshot[key] !== expected[key]) throw new RangeError(`Snapshot ${key} does not match its workflow and step.`);
  }
  return expected;
}

export function probeVirtualEnvironment(snapshot,target) {
  if (!['base','venv','shell'].includes(target)) throw new RangeError('Interpreter target must be "base", "venv", or "shell".');
  const state = validateSnapshot(snapshot);
  const useEnvironment = target === 'venv' || (target === 'shell' && state.activated);
  const interpreter = useEnvironment ? VENV_PYTHON : BASE_PYTHON;
  const command = target === 'shell' ? 'python app.py' : target === 'venv' ? '.venv/bin/python app.py' : `${BASE_PYTHON} app.py`;
  const available = !useEnvironment || state.hasEnvironment;
  const success = available && useEnvironment && state.hasRequests;
  const output = !available
    ? '.venv/bin/python: No such file or directory\n'
    : success
      ? 'requests is available\n'
      : "ModuleNotFoundError: No module named 'requests'\n";
  return {interpreter,available,success,command,output};
}
