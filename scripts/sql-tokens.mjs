// Conservative SQL token comparison: ignore comments/spacing only outside literals.
// Quoted identifiers, strings and dollar-quoted strings retain their exact bytes.
export function sqlTokens(source){
 const tokens=[];let i=0;
 while(i<source.length){
  if(/\s/.test(source[i])){i++;continue}
  if(source.startsWith('--',i)){const end=source.indexOf('\n',i+2);i=end<0?source.length:end+1;continue}
  if(source.startsWith('/*',i)){
   let depth=1;i+=2;
   while(i<source.length&&depth){
    if(source.startsWith('/*',i)){depth++;i+=2}
    else if(source.startsWith('*/',i)){depth--;i+=2}
    else i++;
   }
   if(depth)throw new Error('Unterminated SQL comment');
   continue;
  }
  const start=i,quote=source[i];
  if(quote==="'"||quote==='"'){
   const escapes=quote==="'"&&/[eE]/.test(source[i-1]||'')&&!/[A-Za-z_0-9$]/.test(source[i-2]||'');
   i++;let closed=false;
   while(i<source.length){
    if(escapes&&source[i]==='\\'){i+=2;continue}
    if(source[i]===quote){if(source[i+1]===quote){i+=2;continue}i++;closed=true;break}
    i++;
   }
   if(!closed)throw new Error('Unterminated SQL quote');
   tokens.push(source.slice(start,i));continue;
  }
  const dollar=source.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z_0-9]*)?\$/);
  if(dollar){
   const end=source.indexOf(dollar[0],i+dollar[0].length);
   if(end<0)throw new Error('Unterminated SQL dollar quote');
   i=end+dollar[0].length;tokens.push(source.slice(start,i));continue;
  }
  const word=source.slice(i).match(/^(?:[A-Za-z_][A-Za-z_0-9$]*|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/);
  if(word){i+=word[0].length;tokens.push(word[0]);continue}
  if(/[-+*/<>=~!@#%^&|:`?]/.test(source[i])){
   i++;
   while(i<source.length&&/[-+*/<>=~!@#%^&|:`?]/.test(source[i])
    &&!source.startsWith('--',i)&&!source.startsWith('/*',i))i++;
  }else i++;
  tokens.push(source.slice(start,i));
 }
 return tokens;
}
