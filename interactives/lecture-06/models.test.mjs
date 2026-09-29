import test from 'node:test';
import assert from 'node:assert/strict';
import {parseJSON,inspectJSON,jsonNodes,pathLabel,createBookstore,changeAuthor,addBookReviews,bookstoreView,createDocuments,documentOperation,findDocuments,shortestPath} from './models.mjs';

test('JSON parser preserves all six types and rejects invalid, deep, oversized, and non-finite input',()=>{
  const data=parseJSON('{"s":"21","n":21,"b":true,"z":null,"a":[],"o":{}}');
  assert.deepEqual(jsonNodes(data).map(node=>node.type),['object','string','number','boolean','null','array','object']);
  for(const text of ['{"x":1,}','{x:1}','//comment\n{}','1e400','['.repeat(13)+'0'+']'.repeat(13),JSON.stringify(Array(400).fill(1)),' '.repeat(40001)])assert.throws(()=>parseJSON(text));
});
test('JSON paths preserve literal keys, distinguish null/missing, and never follow prototypes',()=>{
  const data=parseJSON('{"a.b":[{"quote\\\"key":null}],"__proto__":{"safe":true},"courses":["DS2022"]}');
  assert.deepEqual(inspectJSON(data,'$["a.b"][0]["quote\\\"key"]').value,null);
  assert.equal(inspectJSON(data,'$.__proto__.safe').value,true);
  assert.equal(inspectJSON(data,'$.constructor').found,false);
  assert.equal(inspectJSON(data,'$.courses[1]').found,false);
  assert.equal(inspectJSON(data,'$.courses[0]').value,'DS2022');
  assert.equal(inspectJSON(data,'$.courses["0"]').found,false);
  for(const path of ['a','$.courses[*]','$.courses[-1]','$..name','$.courses[01]','$.courses[9007199254740992]'])assert.throws(()=>inspectJSON(data,path));
  for(const node of jsonNodes(data))assert.deepEqual(inspectJSON(data,pathLabel(node.parts)).value,node.value);
});
test('embedding has one read but shared copies can disagree; referencing updates one owner',()=>{
  const embedded=createBookstore(),original=JSON.stringify(embedded);
  const one=changeAuthor(embedded,'Updated biography.');
  assert.equal(one.changed,1);assert.equal(bookstoreView(one.state).consistent,false);
  assert.equal(bookstoreView(changeAuthor(one.state,'Updated biography.',{allCopies:true}).state).consistent,true);
  assert.equal(bookstoreView(embedded).reads,1);assert.equal(JSON.stringify(embedded),original);
  const referenced=createBookstore({layout:'reference'}),changed=changeAuthor(referenced,'Updated biography.');
  assert.equal(changed.changed,1);assert.equal(bookstoreView(changed.state).consistent,true);assert.equal(bookstoreView(referenced).reads,2);
});
test('bounded review retention discards history while references keep book size stable',()=>{
  let growing=createBookstore(),bounded=createBookstore({history:'recent'}),referenced=createBookstore({reviewStorage:'reference'});
  const small=bookstoreView(growing).bookBytes,stable=bookstoreView(referenced).bookBytes;
  growing=addBookReviews(growing,25);bounded=addBookReviews(bounded,25);referenced=addBookReviews(referenced,25);
  assert.equal(bookstoreView(growing).reviewCount,25);assert.equal(bookstoreView(bounded).reviewCount,3);
  assert.equal(bookstoreView(bounded).reviews[0]._id,'review_23');
  assert.ok(bookstoreView(growing).bookBytes>small);assert.equal(bookstoreView(referenced).bookBytes,stable);
  assert.equal(bookstoreView(referenced).reads,2);assert.throws(()=>addBookReviews(growing,26));
  for(let i=1;i<20;i++)growing=addBookReviews(growing,25);
  assert.throws(()=>addBookReviews(growing));
});
test('document find supports nested equality, AND, numeric bounds, $in, and Mongo null/missing',()=>{
  const docs=createDocuments();
  assert.equal(findDocuments(docs,{'author.name':'Jane Austen'}).length,2);
  assert.deepEqual(findDocuments(docs,{price:{$gte:18,$lt:24},inStock:true}).map(doc=>doc._id),['book_001']);
  assert.deepEqual(findDocuments(docs,{_id:{$in:['book_001','book_003']}}).map(doc=>doc._id),['book_001','book_003']);
  assert.equal(findDocuments(docs,{price:'18'}).length,0);
  assert.equal(findDocuments(docs,{missing:null}).length,3);
  assert.equal(findDocuments([{_id:'n',price:null},{_id:'m'}],{price:{$in:[null]}}).length,2);
  for(const filter of [[],{price:{$gt:'18'}},{price:{$ne:18}},{'author.0':'x'},{author:{name:'Jane Austen'}}])assert.throws(()=>findDocuments(docs,filter));
});
test('CRUD reports exact counts, uses supplied IDs, and preserves input state',()=>{
  const docs=createDocuments(),original=JSON.stringify(docs);
  const inserted=documentOperation(docs,'insertOne',{payload:'{"_id":"book_004","title":"New book","price":10}'});
  assert.equal(inserted.error,null);assert.equal(inserted.documents.length,4);assert.equal(inserted.result.insertedId,'book_004');
  const updated=documentOperation(inserted.documents,'updateOne',{filter:'{"_id":"book_004"}',payload:'{"$set":{"author.name":"Maya","price":12}}'});
  assert.deepEqual(updated.result,{acknowledged:true,matchedCount:1,modifiedCount:1});assert.equal(updated.documents[3].author.name,'Maya');
  const noop=documentOperation(updated.documents,'updateOne',{filter:'{"_id":"book_004"}',payload:'{"$set":{"price":12}}'});
  assert.equal(noop.result.modifiedCount,0);
  const deleted=documentOperation(updated.documents,'deleteOne',{filter:'{"_id":"book_004"}'});
  assert.equal(deleted.result.deletedCount,1);assert.equal(deleted.documents.length,3);
  assert.equal(documentOperation(docs,'deleteOne',{filter:'{"_id":"absent"}'}).result.deletedCount,0);
  assert.equal(JSON.stringify(docs),original);
});
test('CRUD validation failure is atomic, including late conflicting paths and scalar traversal',()=>{
  const docs=createDocuments();
  const cases=[['insertOne','{}','{"_id":"book_001"}'],['insertOne','{}','{"title":"No ID"}'],['insertOne','{}','{"_id":"x","__proto__":{"polluted":true}}'],['updateOne','{}','{"$set":{"price":10,"title.bad":1}}'],['updateOne','{}','{"$set":{"_id":"x"}}'],['updateOne','{}','{"$set":{"author":{},"author.name":"X"}}'],['updateOne','{}','{"$inc":{"price":1}}'],['find','{invalid}','{}']];
  for(const [operation,filter,payload] of cases){const result=documentOperation(docs,operation,{filter,payload});assert.ok(result.error);assert.deepEqual(result.documents,docs);}
  assert.equal({}.polluted,undefined);
});
test('updateOne and deleteOne affect only the first matching document; find returns copies',()=>{
  const docs=createDocuments(),found=findDocuments(docs,{});found[0].title='changed';assert.notEqual(docs[0].title,'changed');
  const updated=documentOperation(docs,'updateOne',{payload:'{"$set":{"inStock":false}}'});
  assert.equal(updated.result.matchedCount,1);assert.equal(updated.documents[2].inStock,true);
  assert.deepEqual(documentOperation(docs,'deleteOne').documents.map(doc=>doc._id),['book_002','book_003']);
});
test('breadth-first search returns a shortest path, with directions and missing edges respected',()=>{
  const result=shortestPath('maya','rowan');assert.equal(result.distance,4);assert.equal(result.nodes[0],'maya');assert.equal(result.nodes.at(-1),'rowan');
  assert.equal(shortestPath('maya','rowan',{directed:true}).found,false);
  assert.equal(shortestPath('maya','rowan',{disabled:['e7']}).found,false);
  assert.deepEqual(shortestPath('maya','maya').nodes,['maya']);assert.equal(shortestPath('maya','maya').distance,0);
  assert.throws(()=>shortestPath('absent','maya'));
  assert.deepEqual(shortestPath('maya','rowan'),result);
});
