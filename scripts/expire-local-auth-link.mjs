import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {localStatus} from '../qa/staging/local-guard.mjs';

// Fault injection only: local disposable accounts, never a caller-selected host,
// user ID, query, column or timestamp. No tokens or privileged keys are returned.
const status=localStatus(JSON.parse(readFileSync(process.env.HUSTLE_LOCAL_STATUS,'utf8')));
const [kind,email]=process.argv.slice(2);
if(!['signup','recovery'].includes(kind)||!/^hustle-auth-[a-z-]+@example\.test$/.test(email||''))throw new Error('Only synthetic auth link expiry is supported');
const column=kind==='signup'?'confirmation_sent_at':'recovery_sent_at';
const db=new URL(status.DB_URL);
const affected=execFileSync('psql',['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-c',`with expired as (update auth.users set ${column}=now()-interval '2 hours' where email='${email}' returning id) select count(*) from expired;`],{
 env:{...process.env,PGHOST:'127.0.0.1',PGPORT:'54322',PGUSER:'postgres',PGDATABASE:'postgres',PGPASSWORD:decodeURIComponent(db.password)},encoding:'utf8',stdio:['ignore','pipe','pipe']
}).trim();
if(affected!=='1')throw new Error('Expected exactly one synthetic account');
