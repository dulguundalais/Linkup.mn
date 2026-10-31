import {readFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {sqlTokens} from './sql-tokens.mjs';

function comparable(key,value){
 if(!key.startsWith('function:')||!value||typeof value.body!=='string')return value;
 const {body,definition_md5,...attributes}=value;
 return {...attributes,body_tokens:sqlTokens(body)};
}
export function withRoutineEvidence(base,routines){
 const keys=Object.keys(base).filter(key=>key.startsWith('function:')).sort();
 if(!keys.length||!isDeepStrictEqual(keys,Object.keys(routines).sort()))throw new Error('Routine evidence scope differs');
 const merged={...base};
 for(const key of keys){
  if(routines[key].definition_md5!==base[key].definition_md5)throw new Error('Routine digest changed since original capture: '+key);
  if(Object.keys(base[key]).some(attribute=>!isDeepStrictEqual(base[key][attribute],routines[key][attribute])))throw new Error('Routine attributes changed since original capture: '+key);
  merged[key]={...base[key],...routines[key]};
 }
 return merged;
}

export function schemaDifferences(expected,actual){
 if(!expected||!actual||Array.isArray(expected)||Array.isArray(actual)
    ||typeof expected!=='object'||typeof actual!=='object')throw new Error('Expected schema objects');
 const keys=[...new Set([...Object.keys(expected),...Object.keys(actual)])].sort();
 if(!keys.length)throw new Error('Refusing an empty schema comparison');
 return keys.filter(key=>!isDeepStrictEqual(comparable(key,expected[key]),comparable(key,actual[key]))).map(key=>({
  key,expected:expected[key]??null,actual:actual[key]??null
 }));
}
if(process.argv[1]?.endsWith('compare-schema-evidence.mjs')){
 const [expectedPath,actualPath,routinesPath]=process.argv.slice(2);
 if(!expectedPath||!actualPath)throw new Error('Usage: node scripts/compare-schema-evidence.mjs EXPECTED.json ACTUAL.json [ROUTINES.json]');
 const base=JSON.parse(readFileSync(expectedPath,'utf8'));
 const expected=routinesPath?withRoutineEvidence(base,JSON.parse(readFileSync(routinesPath,'utf8'))):base;
 const actual=JSON.parse(readFileSync(actualPath,'utf8'));
 const differences=schemaDifferences(expected,actual);
 if(differences.length){
  console.error(JSON.stringify({status:'DIFFERENT',count:differences.length,differences},null,2));
  process.exitCode=1;
 }else{
  const representationOnly=Object.keys(expected).filter(key=>key.startsWith('function:')&&expected[key]?.definition_md5!==actual[key]?.definition_md5);
  console.log(JSON.stringify({status:'MATCH',objects:Object.keys(expected).length,representationOnly}));
 }
}
