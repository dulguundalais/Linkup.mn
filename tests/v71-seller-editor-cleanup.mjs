import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('step 1 of the service editor is short and the chosen pricing model is obvious',()=>{
 const f=read('components/service-category-fields.tsx'),css=read('app/v71-service-editor.css');
 for(const gone of ['Тохирох ангилал олдсонгүй юу? Шинэ ангилал','Суурь багцын үнэ нь','Санал шууд нийтлэгдэхгүй','таслалаар, 8 хүртэл','hintMn'])assert.ok(!f.includes(gone),gone);
 assert.match(f,/className=\{'v71-type'\+\(type===s\.id\?' is-selected':''\)\}/);
 assert.match(f,/<Check size=\{14\}/,'a tick on the chosen card');
 assert.match(f,/import '\.\.\/app\/v71-service-editor\.css';/,'styles load in the seller studio too');
 assert.match(css,/\.v71-type\.is-selected\{[^}]*border-color/);
});
test('sellers can delete their own services; order history is archived, never erased',()=>{
 const sql=read('supabase/migrations/20261029120000_v71_delete_own_service.sql');
 assert.match(sql,/if v_owner is null or v_owner<>v_uid then raise exception 'Service not found'/,'only the owner');
 assert.match(sql,/exists\(select 1 from public\.orders where service_id=p_service\)[\s\S]*exists\(select 1 from public\.reviews where service_id=p_service\)[\s\S]*exists\(select 1 from public\.project_proposals where service_id=p_service\)/);
 assert.match(sql,/set status='archived'/);
 assert.match(sql,/revoke all on function public\.delete_own_service\(uuid\) from public,anon;/);
 assert.match(sql,/security definer set search_path=''/);
 const w=read('components/workspace.tsx'),b=read('components/service-delete-button.tsx');
 assert.match(w,/<ServiceDeleteButton en=\{en\} serviceId=\{s\.id\}/);
 assert.match(w,/myServices=listings\.filter\(s=>s\.seller_id===uid&&s\.status!=='archived'\)/);
 assert.match(b,/rpc\('delete_own_service',\{p_service:serviceId\}\)/);
 assert.match(b,/Тийм, устгах/,'asks once before deleting');
 assert.doesNotMatch(b,/window\.confirm|confirm\(/);
});
test('V72: feedback is visible where the person is looking',()=>{
 const b=read('components/service-delete-button.tsx'),css=read('app/v72-workspace-toast.css');
 assert.match(b,/\{problem&&<p className="v72-delete-problem" role="alert">\{problem\}<\/p>\}/,'error next to the delete button');
 assert.match(b,/Устгах боломж одоохондоо идэвхжээгүй байна/);
 assert.match(css,/\.workspace-message\{position:fixed;/,'messages float in view, not at the top of the page');
 assert.match(read('components/workspace.tsx'),/import '\.\.\/app\/v72-workspace-toast\.css';/);
});
