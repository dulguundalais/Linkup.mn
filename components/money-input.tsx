'use client';

import {useLayoutEffect,useRef,type InputHTMLAttributes} from 'react';

/** Digits only, no leading zeros, at most 12 digits. */
export const moneyDigits=(value:string)=>value.replace(/\D/g,'').replace(/^0+(?=\d)/,'').slice(0,12);
/** 1000000 → "1,000,000" (same grouping as the prices shown on the site). */
export const groupMoney=(value:string|number|null|undefined)=>moneyDigits(String(value??'')).replace(/\B(?=(\d{3})+(?!\d))/g,',');

type Props=Omit<InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'|'type'|'inputMode'>&{
 value:string|number|null|undefined;
 /** Receives the plain digits, e.g. "1000000" ("" when empty). */
 onChange:(digits:string)=>void;
};

/**
 * A money field that shows thousands separators while typing (1,000,000)
 * and hands back plain digits. The caret stays after the same digit when
 * separators are added or removed.
 */
export default function MoneyInput({value,onChange,...rest}:Props){
 const ref=useRef<HTMLInputElement>(null);
 const caretDigits=useRef<number|null>(null);
 const shown=groupMoney(value);

 useLayoutEffect(()=>{
  const input=ref.current,count=caretDigits.current;
  caretDigits.current=null;
  if(!input||count===null||document.activeElement!==input)return;
  let pos=0,seen=0;
  while(pos<shown.length&&seen<count){if(/\d/.test(shown[pos]))seen++;pos++}
  input.setSelectionRange(pos,pos);
 },[shown]);

 return <input {...rest} ref={ref} type="text" inputMode="numeric" autoComplete="off" value={shown}
  onChange={e=>{
   const raw=e.target.value,caret=e.target.selectionStart??raw.length;
   const before=moneyDigits(raw.slice(0,caret));
   const digits=moneyDigits(raw);
   caretDigits.current=Math.min(before.length,digits.length);
   onChange(digits);
  }}/>;
}
