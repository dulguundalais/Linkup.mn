import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home=read('components/premium-marketplace.tsx')+read('components/site-header.tsx');const story=read('components/signature-home.tsx');const discovery=read('components/v19-discovery.tsx');
test('home sections retain discovery, marketplace and trust without redundant intro',()=>{
 const needles=["<SiteHeader en={en}","<SignatureHero en={en}/>","<CategoryShowcase en={en}/>","<LiveCatalog en={en}","id=\"how\"","id=\"for-freelancers\"","className=\"signature-partner shell\"","<PremiumFooter en={en}/>"];
 const offsets=needles.map((n,i)=>{const s=i<4||i===7?home:story;return s.indexOf(n)});
 assert.ok(offsets.every(i=>i>=0),JSON.stringify(offsets));
 assert.ok(offsets[0]<offsets[1]&&offsets[1]<offsets[2]&&offsets[2]<offsets[3]);
 assert.ok(offsets[4]<offsets[5]&&offsets[5]<offsets[6]);
 assert.doesNotMatch(story,/id="talent"/,'freelancers appear once, in the service cards');
});
test('homepage categories are actual Explore links, never fake services',()=>{assert.match(discovery,/href=\{'\/explore\/\?category='\+key\}/);assert.match(home,/view==='explore'&&<section className="shell discovery"/);assert.match(home,/view==='home'&&<SignatureProcess/);/* V60: SignatureStory split into process, freelancer band and partner sections */});
test('seller listings retain real catalog and opt-in visibility',()=>{const s=read('components/live-catalog.tsx');assert.match(s,/rpc\('marketplace_catalog'\)/);assert.match(s,/contactSellerHref\(s.slug,signedIn\)/);assert.doesNotMatch(discovery,/4\.9|12K|escrow-protected/i)});
test('microcopy reduced and UI type has larger base scale',()=>{const css=read('app/v19-home.css');assert.match(css,/font-size:16px/);assert.doesNotMatch(story,/signature-search-subline/,'V59: helper line removed by the owner');assert.doesNotMatch(story,/signature-popular/);assert.doesNotMatch(story,/signature-trust-strip/)});
