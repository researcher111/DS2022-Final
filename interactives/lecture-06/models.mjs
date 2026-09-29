// Deterministic teaching models. Inputs are data; no supplied code is executed.
const copy = value => JSON.parse(JSON.stringify(value));
const own = (object,key) => Object.prototype.hasOwnProperty.call(object,key);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export const jsonType = value => value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
export const JSON_SAMPLE = JSON.stringify({name:'Maya Chen',age:21,active:true,address:{city:'Charlottesville',state:'VA'},courses:['DS2022','STAT2120'],phones:[{type:'mobile',number:'555-0101'},{type:'home',number:null}]},null,2);

export function parseJSON(text) {
  if(typeof text !== 'string' || text.length > 40000) throw new RangeError('Use at most 40,000 characters of JSON.');
  let value; try { value = JSON.parse(text); } catch(error) { throw new SyntaxError(`Invalid JSON: ${error.message}`); }
  let count=0;
  function walk(item,depth) {
    if(depth>12 || ++count>400) throw new RangeError('This classroom inspector allows 400 values and 12 nesting levels.');
    if(typeof item==='number' && !Number.isFinite(item)) throw new RangeError('Numbers must fit a finite JavaScript number in this activity.');
    if(item && typeof item==='object') Object.values(item).forEach(child=>walk(child,depth+1));
  }
  walk(value,0); return value;
}
export function pathLabel(parts) { return '$'+parts.map(part=>typeof part==='number'?`[${part}]`:/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)?`.${part}`:`[${JSON.stringify(part)}]`).join(''); }
export function parseInspectorPath(path) {
  if(typeof path!=='string' || path.length>1000 || !path.startsWith('$')) throw new SyntaxError('A path starts with $, for example $.phones[0].type.');
  const parts=[]; let tail=path.slice(1);
  while(tail) {
    let match=tail.match(/^\.([A-Za-z_][A-Za-z0-9_]*)/);
    if(match) parts.push(match[1]);
    else if((match=tail.match(/^\[(0|[1-9][0-9]*)\]/))) { const n=Number(match[1]); if(!Number.isSafeInteger(n)) throw new RangeError('Array index is too large.'); parts.push(n); }
    else if((match=tail.match(/^\[("(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*")\]/))) parts.push(JSON.parse(match[1]));
    else throw new SyntaxError('Use .field, [0], or ["field name"]. Wildcards, slices, and recursive search are not supported.');
    tail=tail.slice(match[0].length);
  }
  return parts;
}
export function inspectJSON(value,path) {
  const parts=typeof path==='string'?parseInspectorPath(path):path; let current=value;
  for(const part of parts) {
    if(typeof part==='number' ? !Array.isArray(current) : !object(current)) return {found:false,path:pathLabel(parts)};
    if(!own(current,part)) return {found:false,path:pathLabel(parts)};
    current=current[part];
  }
  return {found:true,path:pathLabel(parts),type:jsonType(current),value:copy(current)};
}
export function jsonNodes(value) {
  const nodes=[];
  function visit(item,parts) { nodes.push({path:pathLabel(parts),parts,depth:parts.length,type:jsonType(item),label:parts.length?String(parts.at(-1)):'root',value:item}); if(item&&typeof item==='object') Object.entries(item).forEach(([key,child])=>visit(child,[...parts,Array.isArray(item)?Number(key):key])); }
  visit(value,[]); return nodes;
}

export function createBookstore({layout='embed',reviewStorage='embed',history='all'}={}) {
  if(!['embed','reference'].includes(layout)||!['embed','reference'].includes(reviewStorage)||!['all','recent'].includes(history)) throw new RangeError('Unknown bookstore design.');
  const author={_id:'author_001',name:'Jane Austen',bio:'British novelist.'};
  const books=['Pride and Prejudice','Emma'].map((title,index)=>({_id:`book_00${index+1}`,title,...(layout==='embed'?{author:copy(author)}:{author_id:author._id}),...(reviewStorage==='embed'?{reviews:[]}:{})}));
  return {layout,reviewStorage,history,authors:layout==='reference'?[author]:[],books,reviews:[],reviewSequence:0};
}
export function changeAuthor(state,bio,{allCopies=false}={}) {
  if(typeof bio!=='string'||!bio.trim()||bio.length>180) throw new RangeError('Enter a biography of 1–180 characters.');
  const next=copy(state); let changed=0;
  if(next.layout==='reference') {next.authors[0].bio=bio;changed=1;}
  else for(const book of (allCopies?next.books:next.books.slice(0,1))) {book.author.bio=bio;changed++;}
  return {state:next,changed};
}
export function addBookReviews(state,count=1) {
  if(!Number.isInteger(count)||count<1||count>25) throw new RangeError('Add 1–25 reviews at a time.');
  if(state.reviewSequence+count>500) throw new RangeError('Classroom limit: 500 generated reviews. Reset to start again.');
  const next=copy(state),target=next.reviewStorage==='embed'?next.books[0].reviews:next.reviews;
  for(let i=0;i<count;i++) {const n=++next.reviewSequence;target.push({_id:`review_${n}`,book_id:'book_001',rating:3+(n%3),comment:`Synthetic review ${n}.`});}
  if(next.history==='recent') target.splice(0,Math.max(0,target.length-3));
  return next;
}
export function bookstoreView(state) {
  const books=state.books.map(book=>({...copy(book),author:copy(state.layout==='embed'?book.author:state.authors.find(author=>author._id===book.author_id))}));
  const reviews=state.reviewStorage==='embed'?state.books[0].reviews:state.reviews;
  return {books,reviews:copy(reviews),consistent:books.every(book=>book.author.bio===books[0].author.bio),reads:1+(state.layout==='reference'?1:0)+(state.reviewStorage==='reference'?1:0),reviewCount:reviews.length,bookBytes:new TextEncoder().encode(JSON.stringify(state.books[0])).length};
}

export const DOCUMENT_SEED=[
  {_id:'book_001',title:'Pride and Prejudice',published_year:1813,price:18,author:{name:'Jane Austen'},inStock:true},
  {_id:'book_002',title:'Emma',published_year:1815,price:24,author:{name:'Jane Austen'},inStock:false},
  {_id:'book_003',title:'Great Expectations',published_year:1861,price:15,author:{name:'Charles Dickens'},inStock:true}
];
export const createDocuments = () => copy(DOCUMENT_SEED);
const forbidden = new Set(['__proto__','prototype','constructor']);
function fields(value) {
  if(value&&typeof value==='object') for(const [key,child] of Object.entries(value)) {
    if(forbidden.has(key)||key.startsWith('$')||key.includes('.')) throw new TypeError('Stored field names cannot contain dots, start with $, or use prototype-related names in this simulator.');
    fields(child);
  }
}
function documentPath(path) {
  if(typeof path!=='string'||!path.split('.').every(part=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(part)&&!forbidden.has(part))) throw new TypeError('Use dotted object fields such as author.name; array traversal is outside this subset.');
  return path.split('.');
}
function documentValue(doc,path) {let value=doc;for(const part of documentPath(path)){if(!object(value)||!own(value,part)) return {found:false};value=value[part];}return {found:true,value};}
const scalar = value => value===null || ['string','number','boolean'].includes(typeof value);
function validateFilter(filter) {
  if(!object(filter)) throw new TypeError('Filter must be a JSON object.');
  for(const [path,test] of Object.entries(filter)) {
    documentPath(path);
    if(scalar(test)) continue;
    if(!object(test)||!Object.keys(test).length) throw new TypeError('Use scalar equality, numeric comparisons, or $in with scalar values.');
    for(const [op,operand] of Object.entries(test)) {
      if(['$gt','$gte','$lt','$lte'].includes(op)) {if(typeof operand!=='number') throw new TypeError(`${op} requires a number in this simulator.`);}
      else if(op==='$in') {if(!Array.isArray(operand)||!operand.every(scalar)) throw new TypeError('$in requires an array of scalar values.');}
      else throw new TypeError(`Unsupported operator ${op}. Use $gt, $gte, $lt, $lte, or $in.`);
    }
  }
}
function equal(value,test) {return test===null ? !value.found || value.value===null : value.found && value.value===test;}
function matches(doc,filter) {
  return Object.entries(filter).every(([path,test])=>{
    const value=documentValue(doc,path); if(scalar(test)) return equal(value,test);
    return Object.entries(test).every(([op,operand])=>{
      if(op==='$in') return operand.some(item=>equal(value,item));
      if(!value.found||typeof value.value!=='number') return false;
      return op==='$gt'?value.value>operand:op==='$gte'?value.value>=operand:op==='$lt'?value.value<operand:value.value<=operand;
    });
  });
}
export function findDocuments(documents,filter) {validateFilter(filter);return copy(documents.filter(doc=>matches(doc,filter)));}
export function documentOperation(documents,operation,{filter='{}',payload='{}'}={}) {
  try {
    const next=copy(documents); let result;
    if(operation==='insertOne') {
      if(next.length>=50) throw new RangeError('Classroom limit: 50 documents.');
      const doc=parseJSON(payload);if(!object(doc)) throw new TypeError('Insert a JSON object.');fields(doc);
      if(typeof doc._id!=='string'||!doc._id.trim()||doc._id.length>80) throw new TypeError('Supply a nonempty string _id of at most 80 characters in this simulator.');
      if(next.some(item=>item._id===doc._id)) throw new TypeError(`Duplicate _id: ${doc._id}. No document inserted.`);
      next.push(doc);result={acknowledged:true,insertedId:doc._id};
    } else {
      const query=parseJSON(filter);validateFilter(query);
      if(operation==='find') result=next.filter(doc=>matches(doc,query));
      else if(operation==='deleteOne') {const index=next.findIndex(doc=>matches(doc,query));if(index>=0)next.splice(index,1);result={acknowledged:true,deletedCount:index>=0?1:0};}
      else if(operation==='updateOne') {
        const update=parseJSON(payload);
        if(!object(update)||Object.keys(update).length!==1||!object(update.$set)||!Object.keys(update.$set).length) throw new TypeError('Use a nonempty {"$set": {"field": value}} update.');
        const entries=Object.entries(update.$set),paths=entries.map(([path])=>{const parts=documentPath(path);if(parts[0]==='_id')throw new TypeError('_id is immutable.');return parts;});
        for(const [,value] of entries) fields(value);
        for(let i=0;i<paths.length;i++)for(let j=i+1;j<paths.length;j++)if(paths[i].every((part,k)=>part===paths[j][k])||paths[j].every((part,k)=>part===paths[i][k]))throw new TypeError('Update paths must not overlap (for example author and author.name).');
        const index=next.findIndex(doc=>matches(doc,query));let modified=0;
        if(index>=0) {
          const before=JSON.stringify(next[index]);
          entries.forEach(([,value],i)=>{let target=next[index];const parts=paths[i];for(const part of parts.slice(0,-1)){if(!own(target,part))target[part]={};if(!object(target[part]))throw new TypeError('Cannot traverse a scalar or array in an update path.');target=target[part];}target[parts.at(-1)]=copy(value);});
          modified=before===JSON.stringify(next[index])?0:1;
        }
        result={acknowledged:true,matchedCount:index>=0?1:0,modifiedCount:modified};
      } else throw new TypeError('Choose find, insertOne, updateOne, or deleteOne.');
    }
    return {documents:next,result:copy(result),error:null};
  } catch(error) {return {documents:copy(documents),result:null,error:error.message};}
}

export const GRAPH_NODES=[{id:'maya',label:'Maya',kind:'reader',x:90,y:100},{id:'eli',label:'Eli',kind:'reader',x:90,y:310},{id:'signal',label:'Signal Garden',kind:'book',x:350,y:70},{id:'stars',label:'Small Stars',kind:'book',x:350,y:210},{id:'quiet',label:'Quiet Algorithm',kind:'book',x:350,y:350},{id:'noor',label:'Noor',kind:'author',x:620,y:120},{id:'rowan',label:'Rowan',kind:'author',x:620,y:325}];
export const GRAPH_EDGES=[{id:'e1',from:'maya',to:'signal',label:'READ'},{id:'e2',from:'maya',to:'stars',label:'READ'},{id:'e3',from:'eli',to:'stars',label:'READ'},{id:'e4',from:'eli',to:'quiet',label:'READ'},{id:'e5',from:'noor',to:'signal',label:'WROTE'},{id:'e6',from:'noor',to:'stars',label:'WROTE'},{id:'e7',from:'rowan',to:'quiet',label:'WROTE'}];
export function shortestPath(start,end,{directed=false,disabled=[]}={}) {
  if(!GRAPH_NODES.some(node=>node.id===start)||!GRAPH_NODES.some(node=>node.id===end)) throw new RangeError('Choose two graph nodes.');
  const queue=[start],seen=new Set([start]),parent=new Map(),trace=[];
  while(queue.length) {
    const node=queue.shift();trace.push({node,frontier:[...queue],discovered:[]});
    if(node===end) {const nodes=[end],edges=[];while(parent.has(nodes[0])){const previous=parent.get(nodes[0]);nodes.unshift(previous.node);edges.unshift(previous.edge);}return {found:true,nodes,edges,trace,distance:edges.length};}
    for(const edge of GRAPH_EDGES) {
      if(disabled.includes(edge.id))continue;
      const neighbor=edge.from===node?edge.to:!directed&&edge.to===node?edge.from:null;
      if(neighbor&&!seen.has(neighbor)){seen.add(neighbor);queue.push(neighbor);parent.set(neighbor,{node,edge:edge.id});trace.at(-1).discovered.push(neighbor);}
    }
    trace.at(-1).frontier=[...queue];
  }
  return {found:false,nodes:[],edges:[],trace,distance:null};
}
