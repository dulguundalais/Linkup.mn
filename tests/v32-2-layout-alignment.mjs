import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('app/unified-layout.css');

test('one centralized container grid owns hero, business, header and footer',()=>{
 assert.match(css,/--hustle-content-max:\s*1400px/);
 assert.match(css,/--hustle-page-gutter:\s*clamp\(20px,\s*3\.7vw,\s*48px\)/);
 assert.match(css,/\.hustle-v5 \.shell,/);
 assert.match(css,/\.hustle-v5 \.business-solutions-inner,/);
 assert.match(css,/\.hustle-v5 \.hustle-premium-footer \.shell/);
 const home=read('components/premium-marketplace.tsx');
 assert.match(home,/import '\.\.\/app\/unified-layout\.css'/);
 assert.match(home,/view==='home'&&<SignatureHero en=\{en\}\/>/);
 assert.match(home,/view==='home'&&<BusinessSolutions en=\{en\}\/>/);
});
test('responsive grid has 4, 2 and 1 columns with no minimum card-width overflow',()=>{
 assert.match(css,/grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
 assert.match(css,/grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
 assert.match(css,/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
 assert.match(css,/overflow-wrap:\s*anywhere/);
 assert.match(css,/min-height:\s*0/);
});
test('existing premium sections retain shared .shell and their own full-bleed backgrounds',()=>{
 const hero=read('components/signature-home.tsx');
 const business=read('components/business-solutions.tsx');
 const footer=read('components/premium-footer.tsx');
 assert.match(hero,/className="shell signature-hero-inner( hx-hero-inner)?"/);
 assert.match(hero,/className="signature-process( v60-process)?"/);
 // Freelancers appear once, in the service cards; the duplicate talent section was removed.
 assert.doesNotMatch(hero,/signature-spotlight/);
 assert.match(business,/className="shell business-solutions-inner"/);
 assert.match(footer,/className="shell footer-columns"/);
 assert.match(footer,/className="shell footer-bottom"/);
});

test('seller colored banner edges line up with business and partner card at shared inset',()=>{
 assert.match(css,/\.hustle-v5 \.signature-seller-band\.shell/);
 assert.match(css,/width:\s*calc\(100%\s*-\s*\(2\s*\*\s*var\(--hustle-page-gutter\)\)\)/);
 assert.match(css,/\.hustle-v5 \.signature-partner-inner/);
 const business=read('app/business-solutions.css');
 assert.doesNotMatch(business,/business-solutions-inner\{max-width:1200px/);
 assert.match(business,/business-solutions-inner\{max-width:1400px/);
});
