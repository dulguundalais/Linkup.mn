import {execFileSync,spawnSync} from 'node:child_process';
// Identify the actual checked-out source, including detached CI checkouts.
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[a-f0-9]{40}$/.test(sha))throw new Error('Missing preview source revision');
const result=spawnSync(process.execPath,['scripts/build-preview.mjs'],{stdio:'inherit',env:{...process.env,CF_PAGES_COMMIT_SHA:sha}});
process.exit(result.status??1);
