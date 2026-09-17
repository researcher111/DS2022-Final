// Deterministic classroom models. No shell, Python, network, or package execution.
export const SAMPLE_DATA = 'Ada,91\n bob ,82\nADA,91\nCara,\nDee,104\nEli,73\nFinn,oops';

export function pipeline(raw, {normalize = true, validate = true, unique = true, filter = false, minimum = 80} = {}) {
  const input = String(raw).split(/\r?\n/).filter(line => line.trim() !== '').map((line, index) => {
    const fields = line.split(',');
    return {id: index + 1, name: fields[0] ?? '', score: fields[1] ?? '', columns: fields.length};
  });
  const normalized = input.map(row => normalize ? {...row, name: row.name.trim().toLowerCase(), score: row.score.trim()} : {...row});
  const valid = row => row.columns === 2 && row.name.trim() !== '' && row.score.trim() !== '' && Number.isFinite(Number(row.score)) && Number(row.score) >= 0 && Number(row.score) <= 100;
  const validated = validate ? normalized.filter(valid) : normalized;
  const seen = new Set();
  const deduped = unique ? validated.filter(row => {
    const key = JSON.stringify([row.name, row.score, row.columns]);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  }) : validated;
  const filtered = filter ? deduped.filter(row => row.score.trim() !== '' && Number.isFinite(Number(row.score)) && Number(row.score) >= Number(minimum)) : deduped;
  return {stages:[input, normalized, validated, deduped, filtered], rows:filtered, invalid:input.length - normalized.filter(valid).length, removed:input.length - filtered.length, text:filtered.map(row => `${row.name},${row.score}`).join('\n')};
}

export function commandLookup(directories, command) {
  const found = directories.findIndex(directory => Boolean(directory.commands[command]?.executable));
  return {
    found,
    path: found < 0 ? null : `${directories[found].path}/${command}`,
    version: found < 0 ? null : directories[found].commands[command].version,
    searched: directories.map((directory, index) => ({path:directory.path, state:found >= 0 && index > found ? 'not searched' : index === found ? 'selected' : 'not found'})),
    status:found < 0 ? 127 : 0
  };
}

export function inheritVariable(value, exported) {
  return {parent:String(value), child:exported ? String(value) : null, childOutput:`My favorite animal: ${exported ? String(value) : ''}!\n`};
}

export const STREAM_MODES = {
  terminal:{label:'Terminal', suffix:'', out:'terminal', err:'terminal'},
  replace:{label:'Replace stdout file', suffix:' > out.txt', out:'file', err:'terminal', truncate:true},
  append:{label:'Append stdout file', suffix:' >> out.txt', out:'file', err:'terminal'},
  errors:{label:'Redirect stderr', suffix:' 2> errors.txt', out:'terminal', err:'errors'},
  combined:{label:'Both to file', suffix:' > out.txt 2>&1', out:'file', err:'file', truncate:true},
  order:{label:'Reverse redirect order', suffix:' 2>&1 > out.txt', out:'file', err:'terminal', truncate:true},
  discard:{label:'Discard stdout', suffix:' > /dev/null', out:'discard', err:'terminal'},
  pipe:{label:'Pipe stdout', suffix:' | grep -F -- PATTERN', out:'pipe', err:'terminal'},
  mergedPipe:{label:'Merge, then pipe', suffix:' 2>&1 | grep -F -- PATTERN', out:'pipe', err:'pipe'}
};

export function routeStreams({mode = 'replace', file = 'earlier run\n', stdout = 'Ada,91\nBob,82\n', stderr = 'warning: Ada has a missing field\n', pattern = 'Ada'} = {}) {
  const choice = STREAM_MODES[mode] || STREAM_MODES.terminal;
  const destinations = {terminal:'', file:choice.truncate ? '' : file, errors:'', discard:'', pipe:''};
  // The teaching producer emits all stdout, then all stderr, synchronously.
  destinations[choice.out] += stdout;
  destinations[choice.err] += stderr;
  const piped = choice.out === 'pipe' || choice.err === 'pipe';
  const lines = destinations.pipe.split('\n');
  if (lines.at(-1) === '') lines.pop();
  const matches = piped ? lines.filter(line => line.includes(pattern)) : [];
  const filtered = matches.map(line => `${line}\n`).join('');
  destinations.terminal += filtered;
  return {...destinations, filtered, routes:{stdout:choice.out, stderr:choice.err}, piped, filterStatus:piped ? (matches.length ? 0 : 1) : null};
}

export function controlTrace({mode = 'branch', exists = true, names = ['Ada','Bob','Cara'], operator = '&&', first = 0, second = 0} = {}) {
  if (mode === 'branch') return [
    {node:'test',line:0,label:`Test regular file: ${exists ? 'true (status 0)' : 'false (status 1)'}`,output:'',status:exists ? 0 : 1},
    {node:exists ? 'true' : 'false',line:exists ? 1 : 3,label:exists ? 'Take the then branch' : 'Take the else branch',output:exists ? 'File exists\n' : 'File does not exist\n',status:0},
    {node:'done',line:4,label:'Conditional complete; the selected echo succeeded',output:'',status:0}
  ];
  if (mode === 'loop') {
    const steps = [{node:'start',line:0,label:`Create an array with ${names.length} item${names.length === 1 ? '' : 's'}`,output:'',status:0}];
    names.forEach((name, index) => {
      steps.push({node:'item',item:index,line:1,label:`Assign name = ${name}`,output:'',status:0});
      steps.push({node:'body',item:index,line:2,label:`Iteration ${index + 1}: print the current name`,output:`Name: ${name}\n`,status:0});
    });
    steps.push({node:'done',line:3,label:names.length ? 'No items remain; leave the loop' : 'Empty array; the loop body never runs',output:'',status:0});
    return steps;
  }
  const run = operator === ';' || (operator === '&&' ? Number(first) === 0 : Number(first) !== 0);
  const steps = [
    {node:'first',line:0,label:`check_data returns ${first}`,output:'',status:Number(first)},
    {node:'gate',line:0,label:run ? `The ${operator} rule allows load_data to run` : `The ${operator} rule skips load_data`,output:'',status:Number(first)}
  ];
  if (run) steps.push({node:'second',line:0,label:`load_data runs and returns ${second}`,output:'',status:Number(second)});
  steps.push({node:'done',line:1,label:`List status = ${run ? second : first} (last command executed)`,output:`${run ? second : first}\n`,status:0});
  return steps;
}

// Fictional dependency graph: coursekit 1.0 -> helper 1.x; 2.0 -> helper 2.x.
export function resolvePackages(version, newer = false) {
  return {coursekit:version, helper:version === '1.0' ? (newer ? '1.5' : '1.4') : (newer ? '2.2' : '2.1')};
}
export function environmentState({isolated, required, installed}) {
  return ['a','b'].map(project => {
    const actual = isolated ? installed[project] : installed.shared;
    return {project, required:required[project], actual, ok:actual?.coursekit === required[project], missing:!actual};
  });
}
export function installEnvironment(state, project, {locked = false} = {}) {
  const packages = locked ? state.locks[project] : resolvePackages(state.required[project], state.newer);
  if (!packages) return {state, error:'Create a lock for this project first.'};
  if (locked && packages.coursekit !== state.required[project]) return {state, error:'The lock no longer matches this requirement. uv sync --locked would report an error; recreate the lock.'};
  const destination = state.isolated ? project : 'shared';
  return {state:{...state, installed:{...state.installed, [destination]:{...packages}}}, error:null};
}
