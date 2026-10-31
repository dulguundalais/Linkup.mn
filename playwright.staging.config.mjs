import {defineConfig} from '@playwright/test';
import {localAppURL} from './qa/staging/local-guard.mjs';
if(process.env.NEXT_PUBLIC_SUPABASE_URL!=='http://127.0.0.1:54321') throw new Error('Staging browser tests require the isolated loopback backend');
export default defineConfig({
 testDir:'./qa/staging',testMatch:'**/*.spec.mjs',timeout:120000,expect:{timeout:15000},workers:1,retries:0,
 reporter:[['list'],['html',{open:'never',outputFolder:'playwright-staging-report'}]],outputDir:'test-results-staging',
 // Do not persist network traces, session state or credentials as CI artifacts.
 use:{baseURL:localAppURL,viewport:{width:1440,height:900},trace:'off',video:'off',screenshot:'only-on-failure'},
 webServer:{command:'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 4179',url:localAppURL+'/api/config',reuseExistingServer:false,timeout:30000}
});
