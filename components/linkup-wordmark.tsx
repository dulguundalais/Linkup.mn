import '../app/linkup-brand.css';
import {LINKUP_WORDMARK_DOT,LINKUP_WORDMARK_TEXT,LINKUP_WORDMARK_VIEWBOX} from '../lib/brand';

// Glyphs use currentColor so the mark follows light/dark themes; the dot keeps
// the logo's softer grey through opacity. Decorative copies pass decorative.
export default function LinkupWordmark({className,decorative=false}:{className?:string;decorative?:boolean}){
 return <svg className={'linkup-wordmark'+(className?' '+className:'')} viewBox={LINKUP_WORDMARK_VIEWBOX} xmlns="http://www.w3.org/2000/svg" role={decorative?undefined:'img'} aria-hidden={decorative||undefined} aria-label={decorative?undefined:'Linkup'} focusable="false">
  <path fill="currentColor" fillRule="evenodd" d={LINKUP_WORDMARK_TEXT}/>
  <path fill="currentColor" fillOpacity={0.72} d={LINKUP_WORDMARK_DOT}/>
 </svg>;
}
