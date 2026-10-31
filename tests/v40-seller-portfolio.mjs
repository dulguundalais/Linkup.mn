import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const read=p=>readFileSync(p,'utf8');
const urlOf=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const catalog=read('lib/marketplace/creative-tools.ts');
const {CREATIVE_TOOLS,CREATIVE_TOOL_MAX,creativeToolFor}=await import(urlOf(catalog));
const source=read('lib/marketplace/public-portfolio-render.ts').replace("from './creative-tools';","from '"+urlOf(catalog)+"';");
const {renderPublicSellerPage}=await import(urlOf(source));
const profile={display_name:'Demo Freelancer',headline:'Design & Web Specialist',bio:'A real portfolio biography',skills:'Branding, UI/UX, Illustration',slug:'test-freelancer',
 portfolio:[{title:'Poster <project>',object_path:'11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.png'}],
 services:[{id:'33333333-3333-4333-8333-333333333333',title:'Web design',title_en:'Web design',description:'Web design details',price:200000,delivery_days:5}],
 tools:[{key:'figma',icon:'auto'},{key:'photoshop',icon:'palette'},{key:'react',icon:'code'}]};
const make=(data=profile,en=false)=>renderPublicSellerPage(data,{en,url:'https://example.com/p/test-freelancer',origin:'https://example.com',title:'Test profile',description:'Test profile desc'});
test('tool picker has curated accessible software with stable unique IDs',()=>{
 assert.ok(CREATIVE_TOOLS.length>=15);
 assert.equal(CREATIVE_TOOL_MAX,16);
 assert.equal(new Set(CREATIVE_TOOLS.map(x=>x.key)).size,CREATIVE_TOOLS.length);
 for(const tool of CREATIVE_TOOLS){assert.ok(tool.name);assert.ok(tool.icon);assert.ok(creativeToolFor(tool.key));}
});
test('public portfolio contains exactly real seller biography, tools, services, work and contact',()=>{
 const html=make();
 for(const target of ['id="about"','id="tools"','id="services"','id="projects"','id="contact"','<svg','Figma','Adobe Photoshop','React','Branding','UI/UX','Illustration','Web design','200,000 ₮','/api/portfolio-image?path=','mode=buyer&amp;seller=test-freelancer'])assert.ok(html.includes(target),target);
 assert.ok(html.indexOf('id="about"')<html.indexOf('id="tools"'));
 assert.ok(html.indexOf('id="tools"')<html.indexOf('id="services"'));
 assert.ok(html.indexOf('id="services"')<html.indexOf('id="projects"'));
 assert.ok(!/testimonial|fake earning|real-time availability|\$[0-9]+\/h/i.test(html));
});
test('public portfolio escapes user content, ignores unrecognized tool keys and malicious icon value',()=>{
 const html=make({...profile,display_name:'<script>alert("X")</script>',skills:'<img src=x>,UI/UX',tools:[{key:'figma',icon:'<img src=x onerror=bad>'},{key:'unsupported-tool',icon:'auto'}]});
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('<img src=x>'));
 assert.ok(!html.includes('unsupported-tool'));
 assert.ok(html.includes('Figma'));
});
test('no fabricated skills, portfolios or testimonials when seller has no data',()=>{
 const html=make({...profile,skills:'',portfolio:[],services:[],tools:[]});
 assert.ok(!html.includes('Figma'));
 assert.ok(!html.includes('Poster'));
 assert.ok(!html.includes('Web design'));
 assert.match(html,/No published services|нийтэлсэн үйлчилгээ/i);
 assert.ok(html.includes('0</b>'));
});
test('tool icon selection is persisted on current seller account with RLS; public projection is opt-in only',()=>{
 const ui=read('components/seller-tool-editor.tsx');
 // V52: the tool picker lives only in Profile Studio (one place for the seller profile).
 const ws=read('components/seller-profile-manager.tsx');
 const sql=read('supabase/migrations/20261024052715_v40_seller_tools.sql');
 assert.match(ui,/\.from\('seller_tools'\)/);
 assert.match(ui,/\.update\(\{icon_key:icon\}\)/);
 assert.match(ui,/getUser\(\)/);
 assert.match(ui,/CREATIVE_TOOL_MAX/);
 assert.match(ui,/aria-pressed=\{choice.icon_key===option.key\}/);
 assert.match(ws,/<SellerToolEditor/);
 assert.match(ws,/skills:draft\.skills/);
 assert.match(sql,/enable row level security/);
 assert.match(sql,/seller_id=\(select auth.uid\(\)\)/);
 assert.match(sql,/p.public_profile and p.is_seller and a.enabled/);
 assert.match(sql,/jsonb_build_object\('key',st.tool_key,'icon',st.icon_key\)/);
 assert.doesNotMatch(sql,/grant (?:select|insert|update|delete) on public.seller_tools to anon/i);
});
test('portfolio CSS responsive without changing homepage theme',()=>{
 const css=read('public/public-profile.css');
 assert.match(css,/\.portfolio-hero/);
 assert.match(css,/\.portfolio-tool-grid/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(css,/https:\/\/[^'"]+\.jpg/);
});


test('buyer clicking seller avatar/name opens opt-in public profile, independent of service detail',()=>{
 const card=read('components/live-catalog.tsx');
 const css=read('app/v39-creative-cards.css');
 const slug=read('lib/marketplace/seller-slug.ts');
 assert.match(card,/isValidSellerSlug\(s\.slug\|\|''\)/);
 assert.match(card,/profileHref\?\s*<Link className="v39-profile-link"/);
 assert.match(card,/href=\{profileHref\}/);
 assert.match(card,/sellerIdentity=<><span className=\{'v39-person-avatar/);
 assert.match(card,/className="v39-person-name"/);
 assert.match(card,/aria-label=\{t\('Профайл үзэх: ','View seller profile: '\)\+s\.display_name\}/);
 assert.match(card,/href=\{detailHref\}/);
 assert.match(card,/onSave\(s\.id\)/);
 assert.match(card,/compareSelection\(/);
 assert.match(css,/\.v39-person-line \.v39-profile-link:hover/);
 assert.match(css,/\.v39-person-line \.v39-profile-link:focus-visible/);
 assert.match(slug,/export function isValidSellerSlug/);
});
test('seller profile link does not navigate to nonexistent/invalid slugs',()=>{
 const card=read('components/live-catalog.tsx');
 assert.match(card,/profileHref=isValidSellerSlug/);
 assert.match(card,/:<span className="v39-profile-identity">\{sellerIdentity\}<\/span>/);
 assert.match(read('lib/marketplace/public-profile.ts'),/if\(!\/\^\[a-z0-9\]/);
});

test('V52 share preview shows the freelancer, not the generic Linkup card',()=>{
 const cover='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.jpg';
 const avatar='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cccccccc-cccc-4ccc-8ccc-cccccccccccc.png';
 const withCover=make({...profile,cover_path:cover,avatar_path:avatar});
 assert.match(withCover,new RegExp('<meta property="og:image" content="https://example.com/api/portfolio-image\\?path='+encodeURIComponent(cover)+'">'));
 assert.match(withCover,/<meta name="twitter:card" content="summary_large_image">/);
 assert.match(withCover,/<meta property="og:title" content="Demo Freelancer · Design &amp; Web Specialist">/);
 const avatarOnly=make({...profile,avatar_path:avatar});
 assert.match(avatarOnly,new RegExp('og:image" content="https://example.com/api/portfolio-image\\?path='+encodeURIComponent(avatar)));
 assert.match(avatarOnly,/twitter:card" content="summary"/);
 const none=make(profile);
 assert.match(none,/og:image" content="https:\/\/example.com\/og\/linkup.png"/,'falls back to the brand card');
 const hostile=make({...profile,cover_path:'../../secret.jpg',avatar_path:'https://evil.example/x.png'});
 assert.doesNotMatch(hostile,/evil\.example|secret\.jpg/,'only validated storage paths are used');
});
