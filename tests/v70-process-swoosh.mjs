import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the how-it-works title keeps its text and gets a decorative streak',()=>{
 const h=read('components/signature-home.tsx'),css=read('app/v70-process-swoosh.css');
 assert.match(h,/<h2 id="how-title"><span className="v70-swoosh-text" ref=\{swooshRef\}>\{t\('Санаанаас бодит ажил хүртэл\.','From idea to finished work\.'\)\}<span className="v70-swoosh" aria-hidden="true">/);
 assert.match(h,/prefers-reduced-motion: reduce/);
 // The resting state is the finished streak; only script hides it until seen.
 assert.match(css,/\.v70-swoosh svg\{[^}]*clip-path:inset\(-12px -12px -12px -12px\)\}/);
 assert.match(css,/\.v70-armed \.v70-swoosh svg\{clip-path:inset\(-12px 100% -12px -12px\)\}/);
 assert.doesNotMatch(css,/animation:[^;]*\b(both|forwards|backwards)\b/,'no fill-mode: never stuck hidden');
});
