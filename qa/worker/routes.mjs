import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {readFileSync} from 'node:fs';
import {Miniflare} from 'miniflare';
import {unstable_dev} from 'wrangler';

const origin='https://isolated-upstream.example.test';
const object='10000000-0000-4000-8000-000000000077/20000000-0000-4000-8000-000000000077.png';
const key='sb_publishable_synthetic_worker_fixture';
let runtime,local;
before(async()=>{
 // The real workerd runtime executes the bundled entry. All outbound calls are
 // handled here; no hosted Supabase or user rows participate in this fixture.
 runtime=new Miniflare({workers:[{
  config:{name:'synthetic-worker-routes',compatibilityDate:'2026-10-30',compatibilityFlags:['nodejs_compat'],
   manifest:{mainModule:'index.js',modulesRoot:resolve('.worker-build'),modules:{'index.js':{type:'esm',contents:readFileSync('.worker-build/index.js','utf8')}}},
   env:{HUSTLE_STAGING_BACKEND:{type:'text',value:'enabled'},NEXT_PUBLIC_SUPABASE_URL:{type:'text',value:origin},NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:{type:'text',value:key},ASSETS:{type:'fetcher',handler:()=>new Response('fixture asset')}}
  },
  dev:{outboundService:{type:'fetcher',handler:async request=>{
   const url=new URL(request.url);
   assert.equal(url.origin,origin);
   assert.equal(request.headers.get('apikey'),key);
   assert.equal(request.method,'POST');
   if(url.pathname==='/rest/v1/rpc/public_seller'){
    const {profile_slug}=await request.json();
    return Response.json(profile_slug==='test-seller'?{display_name:'Synthetic Worker Seller',headline:'Designer',bio:'Isolated fixture only.',slug:'test-seller',portfolio:[],services:[]}:null);
   }
   if(url.pathname==='/storage/v1/object/sign/portfolio/'+object){
    assert.deepEqual(await request.json(),{expiresIn:60});
    return Response.json({signedURL:'/object/sign/portfolio/'+object+'?token=synthetic-token'});
   }
   throw new Error('Unexpected outbound fixture request');
  }}}
 }]});
 await runtime.ready;
 local=await unstable_dev('worker/index.ts',{config:'worker/wrangler.jsonc',local:true,ip:'127.0.0.1',port:4181,logLevel:'error',vars:{NEXT_PUBLIC_SUPABASE_URL:'https://must-not-be-used.example.test',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-unusable-key'},experimental:{disableExperimentalWarning:true,disableDevRegistry:true,forceLocal:true,watch:false}});
});
after(async()=>{await Promise.all([runtime?.dispose(),local?.stop()]);});

test('Worker runs existing public config and opt-in profile handlers',async()=>{
 const config=await runtime.dispatchFetch('https://worker.example.test/api/config');
 assert.equal(config.status,200);assert.equal(config.headers.get('Cache-Control'),'no-store');
 assert.deepEqual(await config.json(),{url:origin,key,support:{email:null,url:null}});
 const profile=await runtime.dispatchFetch('https://worker.example.test/p/test-seller/');
 assert.equal(profile.status,200);const html=await profile.text();
 assert.ok(html.includes('Synthetic Worker Seller'));
 assert.ok(html.includes('https://worker.example.test/p/test-seller'));
 assert.equal((await runtime.dispatchFetch('https://worker.example.test/p/hidden-seller')).status,404);
});

test('Worker signs only the permitted private portfolio image path',async()=>{
 const response=await runtime.dispatchFetch('https://worker.example.test/api/portfolio-image?path='+object,{redirect:'manual'});
 assert.equal(response.status,302);
 assert.equal(response.headers.get('Location'),origin+'/storage/v1/object/sign/portfolio/'+object+'?token=synthetic-token');
 assert.equal(response.headers.get('Referrer-Policy'),'no-referrer');
 assert.equal((await runtime.dispatchFetch('https://worker.example.test/api/portfolio-image?path=../secret')).status,404);
});

test('Worker enforces methods, malformed paths, HEAD and unknown API routing',async()=>{
 assert.equal((await runtime.dispatchFetch('https://worker.example.test/api/config',{method:'POST'})).status,405);
 assert.equal((await runtime.dispatchFetch('https://worker.example.test/api/unknown')).status,404);
 assert.equal((await runtime.dispatchFetch('https://worker.example.test/p/%E0%A4%A')).status,404);
 const head=await runtime.dispatchFetch('https://worker.example.test/p/test-seller',{method:'HEAD'});
 assert.equal(head.status,200);assert.equal(await head.text(),'');
});

test('Wrangler serves real static assets, redirects and missing-route 404s',async()=>{
 const home=await local.fetch('/');assert.equal(home.status,200);
 assert.ok((await home.text()).includes('Linkup'));
 assert.match(home.headers.get('X-Robots-Tag'),/noindex/);
 const marker=await local.fetch('/preview-build.json');assert.equal(marker.status,200);
 assert.match((await marker.json()).commit_sha,/^[0-9a-f]{40}$/);
 const missing=await local.fetch('/not-an-existing-page/');assert.equal(missing.status,404);
 const redirect=await local.fetch('/workspace?tab=orders',{redirect:'manual'});
 assert.equal(redirect.status,301);assert.match(redirect.headers.get('Location'),/\/buyer\/\?tab=orders$/);
});

test('Unconfigured hosted-preview settings never fall back to a remote backend',async()=>{
 for(const path of ['/api/config','/p/test-seller','/api/portfolio-image?path='+object]){
  const response=await local.fetch(path);assert.equal(response.status,503);
 }
 assert.equal((await local.fetch('/api/config')).headers.get('Cache-Control'),'no-store');
 const config=await (await local.fetch('/api/config')).json();
 assert.equal(config.error,'Beta configuration unavailable');assert.equal(config.url,undefined);assert.equal(config.key,undefined);
});
