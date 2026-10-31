import {test} from 'node:test';
import assert from 'node:assert/strict';
import {schemaDifferences,withRoutineEvidence} from '../scripts/compare-schema-evidence.mjs';

import {sqlTokens} from '../scripts/sql-tokens.mjs';
test('routine body evidence must match the original scope and capture digest',()=>{
 const base={'function:rpc':{definition_md5:'original',security_definer:true}};
 const body={'function:rpc':{definition_md5:'original',security_definer:true,body:'begin return 1;end;'}};
 assert.equal(withRoutineEvidence(base,body)['function:rpc'].security_definer,true);
 assert.throws(()=>withRoutineEvidence(base,{}),/scope differs/);
 assert.throws(()=>withRoutineEvidence(base,{'function:other':body['function:rpc']}),/scope differs/);
 assert.throws(()=>withRoutineEvidence(base,{'function:rpc':{...body['function:rpc'],definition_md5:'changed'}}),/digest changed/);
 assert.throws(()=>withRoutineEvidence(base,{'function:rpc':{...body['function:rpc'],security_definer:false}}),/attributes changed/);
 assert.equal(base['function:rpc'].body,undefined);
});
test('SQL tokens ignore comments but preserve quoted and dollar-quoted literal content',()=>{
 assert.deepEqual(sqlTokens("select a/* outer /* nested */ comment */+-- end\nb;"),sqlTokens("select a + b;"));
 assert.deepEqual(sqlTokens("select '-- keep', \"two words\"; -- ignored"),['select',"'-- keep'",',','"two words"',';']);
 assert.notDeepEqual(sqlTokens("select 'a  b';"),sqlTokens("select 'a b';"));
 assert.notDeepEqual(sqlTokens('select $tag$-- keep$tag$;'),sqlTokens('select $tag$keep$tag$;'));
 assert.throws(()=>sqlTokens('/* not closed'),/Unterminated/);
 assert.throws(()=>sqlTokens("select 'not closed"),/Unterminated/);
 assert.throws(()=>sqlTokens('select $tag$not closed'),/Unterminated/);
});
test('routine comparison permits only spacing/comments, not literals or security changes',()=>{
 const a={'function:rpc':{body:"begin return 'hello -- friend';end;",definition_md5:'old',security_definer:true,arguments:'x text'}};
 const b=structuredClone(a);b['function:rpc'].body="begin /* note */ return 'hello -- friend'; end;";b['function:rpc'].definition_md5='new';
 assert.deepEqual(schemaDifferences(a,b),[]);
 b['function:rpc'].body="begin return 'hello friend';end;";
 assert.equal(schemaDifferences(a,b).length,1);
 b['function:rpc'].body=a['function:rpc'].body;b['function:rpc'].security_definer=false;
 assert.equal(schemaDifferences(a,b).length,1);
});

test('schema comparison ignores key order but detects privilege and function drift',()=>{
 const a={'grant:requests.authenticated.SELECT':true,'function:award':{definition_md5:'baseline',security_definer:true}};
 const reordered={'function:award':{security_definer:true,definition_md5:'baseline'},'grant:requests.authenticated.SELECT':true};
 assert.deepEqual(schemaDifferences(a,reordered),[]);
 const b=structuredClone(a);b['function:award'].definition_md5='modified';b['grant:requests.authenticated.SELECT']=false;
 assert.deepEqual(schemaDifferences(a,b).map(x=>x.key),['function:award','grant:requests.authenticated.SELECT']);
 assert.equal(a['function:award'].definition_md5,'baseline');
});
test('schema comparison reports missing and unexpected schema objects',()=>{
 assert.deepEqual(schemaDifferences({'table:request':{rls:true}},{'table:other':{rls:true}}).map(x=>x.key),['table:other','table:request']);
});
test('schema comparison refuses empty or non-object evidence',()=>{
 assert.throws(()=>schemaDifferences({},{}),/empty/);
 assert.throws(()=>schemaDifferences([],{}),/schema objects/);
 assert.throws(()=>schemaDifferences(null,{}),/schema objects/);
});
