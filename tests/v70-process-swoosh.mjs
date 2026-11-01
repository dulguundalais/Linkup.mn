import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the how-it-works title keeps its text and gets a decorative streak',()=>{
 const h=read('components/signature-home.tsx');
 assert.match(h,/<h2 id="how-title"><span className="v70-swoosh-text" ref=\{swooshRef\}>\{t\('Санаанаас бодит ажил хүртэл\.','From idea to finished work\.'\)\}<span className="v70-swoosh" aria-hidden="true">/);
 assert.match(h,/<path d="M0 10 L100 10"/,'straight, level line (owner)');
});
test('it plays once per page load when first seen, then disappears',()=>{
 const h=read('components/signature-home.tsx'),css=read('app/v70-process-swoosh.css');
 assert.match(h,/el\.classList\.add\('v70-play'\);io\.disconnect\(\)/,'only the first time it is seen');
 assert.match(h,/prefers-reduced-motion: reduce/);
 assert.match(css,/\.v70-swoosh\{[^}]*opacity:0\}/,'hidden at rest');
 assert.match(css,/@keyframes v70-life\{0%,73%\{opacity:1\}100%\{opacity:0\}\}/,'fades out at the end');
 assert.doesNotMatch(css,/animation:[^;]*\b(both|forwards|backwards|infinite)\b/);
 assert.doesNotMatch(read('components/signature-home.tsx'),/localStorage[^;]*v70/,'every page load, not once per browser');
});
