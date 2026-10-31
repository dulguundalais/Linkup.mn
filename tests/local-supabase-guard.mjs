import {test} from 'node:test';
import assert from 'node:assert/strict';
import {localStatus} from '../qa/staging/local-guard.mjs';
const valid={API_URL:'http://127.0.0.1:54321',DB_URL:'postgresql://postgres:local@127.0.0.1:54322/postgres',ANON_KEY:'local-anon',SERVICE_ROLE_KEY:'local-root'};
test('isolated fixture guard allows only the exact local API and database',()=>{
 assert.equal(localStatus(valid),valid);
 for(const bad of [
  {...valid,API_URL:'https://example.supabase.co'},
  {...valid,API_URL:'http://localhost:54321'},
  {...valid,DB_URL:'postgresql://postgres:local@db.example.test:54322/postgres'},
  {...valid,DB_URL:'postgresql://postgres:local@127.0.0.1:5432/postgres'},
  {...valid,DB_URL:valid.DB_URL+'?host=db.example.test'},
  {...valid,SERVICE_ROLE_KEY:''}
 ]) assert.throws(()=>localStatus(bad));
});
