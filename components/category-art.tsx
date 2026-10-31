'use client';
import {useId,type ReactNode} from 'react';

/* V50 category artwork — 3D editorial compositions. Every card shares one stage:
   a faded navy field lit by soft blue/cyan light (the V50 home hero), a soft
   floor glow, blurred depth orbs and fine grain. Objects are lit slabs with
   thickness, rim highlights and contact shadows so they read as crafted objects.
   When a raster image exists for a category (public/categories/<art>.webp) the
   card shows that instead; this SVG remains the fallback. */

type Palette={from:string;to:string;glow:string;accent:string;accentDark:string;accent2:string;accent2Dark:string};
const palettes:Record<string,Palette>={
 ai:{from:'#2446b8',to:'#081236',glow:'#4fd7ff',accent:'#5fdcff',accentDark:'#1b8fc0',accent2:'#a597ff',accent2Dark:'#5d4fd0'},
 business:{from:'#22407e',to:'#0a1533',glow:'#6aa2ff',accent:'#f6cf7c',accentDark:'#b8862f',accent2:'#8fb6ff',accent2Dark:'#3d64c4'},
 marketing:{from:'#3a3fc4',to:'#120f46',glow:'#ff7aa8',accent:'#ff86b0',accentDark:'#c3416f',accent2:'#5fdcff',accent2Dark:'#1b8fc0'},
 tech:{from:'#14427a',to:'#051326',glow:'#39e0c3',accent:'#45e6c9',accentDark:'#159c84',accent2:'#94b7ff',accent2Dark:'#3d64c4'},
 'legal-finance':{from:'#18476e',to:'#061a30',glow:'#6fe0b5',accent:'#7ee6c0',accentDark:'#2b9a75',accent2:'#f6cf7c',accent2Dark:'#b8862f'},
 creative:{from:'#3b52d8',to:'#171452',glow:'#ff9a6b',accent:'#ffa37a',accentDark:'#c9603a',accent2:'#ffd774',accent2Dark:'#c79a2c'},
 research:{from:'#1d5aa8',to:'#081d42',glow:'#7cc8ff',accent:'#86ceff',accentDark:'#2d82c9',accent2:'#bff283',accent2Dark:'#6aa93a'},
 commerce:{from:'#2b3d91',to:'#0d1540',glow:'#ffb547',accent:'#ffbd57',accentDark:'#c97d16',accent2:'#5fdcff',accent2Dark:'#1b8fc0'},
 education:{from:'#1a5888',to:'#08203f',glow:'#7be3c0',accent:'#86e8c6',accentDark:'#2f9d7a',accent2:'#ffd774',accent2Dark:'#c79a2c'},
 wellbeing:{from:'#4a53b8',to:'#1a1d55',glow:'#c7b8ff',accent:'#cfc2ff',accentDark:'#7d6ad6',accent2:'#ffc8b0',accent2Dark:'#d98a6a'}
};
palettes.legal=palettes['legal-finance'];palettes.finance=palettes['legal-finance'];

type Kit={p:Palette;u:(k:string)=>string;
 slab:(o:{x:number;y:number;w:number;h:number;r?:number;d?:number;face?:'glass'|'ink'|'accent'|'accent2';shadow?:boolean})=>ReactNode;
 orb:(cx:number,cy:number,r:number,tone?:'accent'|'accent2'|'glass')=>ReactNode;
 shadow:(cx:number,cy:number,rx:number,ry?:number,o?:number)=>ReactNode;
};
const bar=(x:number,y:number,w:number,c='#c5d0ea',h=6)=><rect x={x} y={y} width={w} height={h} rx={h/2} fill={c}/>;

function makeKit(p:Palette,u:(k:string)=>string):Kit{
 const url=(k:string)=>'url(#'+u(k)+')';
 const shadow=(cx:number,cy:number,rx:number,ry=9,o=.55)=><ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#020617" opacity={o} filter={url('blur6')}/>;
 const faces={glass:['glassTop','glassSide'],ink:['inkTop','inkSide'],accent:['accTop','accSide'],accent2:['acc2Top','acc2Side']} as const;
 const slab:Kit['slab']=({x,y,w,h,r=12,d=7,face='glass',shadow:sh=true})=>{
  const [top,side]=faces[face];
  return <g>
   {sh&&shadow(x+w/2,y+h+d+5,w*.46,8,.6)}
   <rect x={x} y={y+d} width={w} height={h} rx={r} fill={url(side)}/>
   <rect x={x} y={y} width={w} height={h} rx={r} fill={url(top)}/>
   <rect x={x} y={y} width={w} height={Math.min(h,56)} rx={r} fill={url('sheen')}/>
   <rect x={x+.75} y={y+.75} width={w-1.5} height={h-1.5} rx={Math.max(1,r-.75)} fill="none" stroke="#ffffff" strokeOpacity={face==='glass'?.9:.22} strokeWidth="1.2"/>
  </g>;
 };
 const orb:Kit['orb']=(cx,cy,r,tone='accent')=><g>
  {shadow(cx,cy+r+4,r*.8,Math.max(3,r*.22),.45)}
  <circle cx={cx} cy={cy} r={r} fill={url(tone==='accent'?'orbA':tone==='accent2'?'orbB':'orbG')}/>
  <ellipse cx={cx-r*.32} cy={cy-r*.38} rx={r*.36} ry={r*.22} fill="#ffffff" opacity=".55" transform={'rotate(-30 '+(cx-r*.32)+' '+(cy-r*.38)+')'}/>
 </g>;
 return {p,u,slab,orb,shadow};
}

function Stage({art,label,children}:{art:string;label:string;children:(k:Kit)=>ReactNode}){
 const uid=useId().replace(/:/g,'');
 const u=(k:string)=>art+'-'+k+'-'+uid;
 const p=palettes[art]||palettes.ai;
 const url=(k:string)=>'url(#'+u(k)+')';
 const kit=makeKit(p,u);
 return <svg viewBox="0 0 300 240" role={label?'img':undefined} aria-label={label||undefined} aria-hidden={label?undefined:true} preserveAspectRatio="xMidYMid meet" className="cat-art-svg" overflow="visible">
  <defs>
   <linearGradient id={u('bg')} x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stopColor={p.from}/><stop offset="1" stopColor={p.to}/></linearGradient>
   <radialGradient id={u('glow')}><stop offset="0" stopColor={p.glow} stopOpacity=".55"/><stop offset="1" stopColor={p.glow} stopOpacity="0"/></radialGradient>
   <radialGradient id={u('glow2')}><stop offset="0" stopColor="#4f7dff" stopOpacity=".55"/><stop offset="1" stopColor="#4f7dff" stopOpacity="0"/></radialGradient>
   <radialGradient id={u('floor')} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#9fc0ff" stopOpacity=".28"/><stop offset="1" stopColor="#9fc0ff" stopOpacity="0"/></radialGradient>
   <linearGradient id={u('glassTop')} x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stopColor="#ffffff"/><stop offset=".6" stopColor="#f1f5ff"/><stop offset="1" stopColor="#dde6fb"/></linearGradient>
   <linearGradient id={u('glassSide')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#aebde3"/><stop offset="1" stopColor="#7d8fbf"/></linearGradient>
   <linearGradient id={u('inkTop')} x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stopColor="#22356d"/><stop offset="1" stopColor="#0c1838"/></linearGradient>
   <linearGradient id={u('inkSide')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a1430"/><stop offset="1" stopColor="#040a1c"/></linearGradient>
   <linearGradient id={u('accTop')} x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stopColor={p.accent}/><stop offset="1" stopColor={p.accentDark}/></linearGradient>
   <linearGradient id={u('accSide')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.accentDark}/><stop offset="1" stopColor="#0a1430"/></linearGradient>
   <linearGradient id={u('acc2Top')} x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stopColor={p.accent2}/><stop offset="1" stopColor={p.accent2Dark}/></linearGradient>
   <linearGradient id={u('acc2Side')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.accent2Dark}/><stop offset="1" stopColor="#0a1430"/></linearGradient>
   <linearGradient id={u('sheen')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".38"/><stop offset="1" stopColor="#ffffff" stopOpacity="0"/></linearGradient>
   <radialGradient id={u('orbA')} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#ffffff"/><stop offset=".28" stopColor={p.accent}/><stop offset="1" stopColor={p.accentDark}/></radialGradient>
   <radialGradient id={u('orbB')} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#ffffff"/><stop offset=".28" stopColor={p.accent2}/><stop offset="1" stopColor={p.accent2Dark}/></radialGradient>
   <radialGradient id={u('orbG')} cx=".35" cy=".3" r=".75"><stop offset="0" stopColor="#ffffff"/><stop offset=".4" stopColor="#dfe8ff"/><stop offset="1" stopColor="#8ea2d6"/></radialGradient>
   <linearGradient id={u('gold')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff1c9"/><stop offset=".45" stopColor="#f2c86e"/><stop offset="1" stopColor="#a8752a"/></linearGradient>
   <linearGradient id={u('goldSide')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c18d36"/><stop offset=".5" stopColor="#f0cd84"/><stop offset="1" stopColor="#9a6a24"/></linearGradient>
   <linearGradient id={u('steel')} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c9d6f2"/><stop offset=".5" stopColor="#ffffff"/><stop offset="1" stopColor="#9eb0d8"/></linearGradient>
   <filter id={u('blur6')} x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="5"/></filter>
   <filter id={u('blur14')} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>
   <filter id={u('grain')}><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter>
  </defs>
  <rect x="-60" y="-80" width="420" height="400" fill={url('bg')}/>
  <circle cx="232" cy="38" r="120" fill={url('glow')}/>
  <circle cx="36" cy="232" r="130" fill={url('glow2')}/>
  <ellipse cx="150" cy="206" rx="150" ry="34" fill={url('floor')}/>
  <circle cx="34" cy="44" r="16" fill={p.accent2} opacity=".22" filter={url('blur14')}/>
  <circle cx="276" cy="196" r="20" fill={p.accent} opacity=".2" filter={url('blur14')}/>
  {children(kit)}
  <rect x="-60" y="-80" width="420" height="400" filter={url('grain')} opacity=".06"/>
 </svg>;
}

const scenes:Record<string,(k:Kit)=>ReactNode>={
 ai:({p,slab,orb,u})=><>
  <g stroke={p.accent} strokeOpacity=".6" strokeWidth="1.6" fill="none">
   <path d="M48 62 C 78 70, 88 92, 92 106"/><path d="M252 54 C 232 62, 216 80, 208 98"/>
   <path d="M258 176 C 236 174, 222 164, 210 150"/><path d="M42 182 C 64 178, 82 166, 92 152"/>
  </g>
  {orb(48,62,9,'accent')}{orb(252,54,8,'accent2')}{orb(258,176,9,'accent')}{orb(42,182,8,'accent2')}
  {slab({x:86,y:62,w:128,h:104,r:18,d:9})}
  {orb(108,86,9,'accent2')}<path d="M104.5 86 l2.5 2.5 l5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
  {bar(124,80,58,'#1c2f63',5)}{bar(124,90,36,'#b7c4e6',5)}
  <rect x="100" y="106" width="100" height="22" rx="11" fill="#e6eeff"/>{bar(110,114,60,'#8fa6d8',5)}
  {slab({x:118,y:134,w:82,h:22,r:11,d:4,face:'accent',shadow:false})}{bar(130,142,46,'#ffffff',5)}
  <circle cx="234" cy="122" r="16" fill={p.accent} opacity=".3" filter={'url(#'+u('blur6')+')'}/>
  <path d="M234 108 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4z" fill="#ffffff"/>
  <path d="M66 112 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5z" fill={p.accent}/>
 </>,
 business:({slab,shadow,u})=><>
  <g transform="rotate(-7 106 124)">
   {slab({x:48,y:46,w:116,h:150,r:12,d:8})}
   {bar(66,68,62,'#1c2f63',7)}{bar(66,86,80)}{bar(66,98,72)}{bar(66,110,78)}{bar(66,130,48,'#1c2f63',6)}{bar(66,144,80)}{bar(66,156,64)}{bar(66,168,74)}
  </g>
  {slab({x:132,y:84,w:132,h:112,r:16,d:10,face:'ink'})}
  {[[150,156,24],[174,142,38],[198,126,54],[222,108,72]].map(([x,y,h],i)=><g key={i}>
   <rect x={x+3} y={y+3} width="16" height={h} rx="4" fill="#020617" opacity=".35"/>
   <rect x={x} y={y} width="16" height={h} rx="4" fill={'url(#'+u(i===3?'gold':'acc2Top')+')'} opacity={i===3?1:.6+i*.12}/>
   <rect x={x+2} y={y+2} width="4" height={h-4} rx="2" fill="#ffffff" opacity=".35"/>
  </g>)}
  <path d="M146 138 L 176 122 L 202 110 L 238 92" stroke={'url(#'+u('gold')+')'} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
  <path d="M229 88 l11 3 l-5 10" stroke="#f6cf7c" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  {shadow(234,72,22,6,.45)}
  <g transform="translate(234 44)"><circle r="22" fill={'url(#'+u('gold')+')'}/><circle r="15" fill="#0c1838"/><circle r="10" fill={'url(#'+u('gold')+')'}/><circle r="4" fill="#0c1838"/><ellipse cx="-8" cy="-10" rx="7" ry="4" fill="#fff" opacity=".5" transform="rotate(-30 -8 -10)"/></g>
 </>,
 marketing:({p,slab,orb,u})=><>
  <path d="M8 214 C 80 198, 140 150, 292 58" stroke={p.accent2} strokeOpacity=".55" strokeWidth="2" fill="none" strokeDasharray="4 6"/>
  {slab({x:104,y:24,w:96,h:192,r:20,d:8,face:'ink'})}
  <rect x="111" y="31" width="82" height="178" rx="14" fill={'url(#'+u('glassTop')+')'}/>
  <rect x="117" y="40" width="70" height="72" rx="10" fill={'url(#'+u('accTop')+')'}/>
  <circle cx="137" cy="62" r="10" fill="#ffffff" opacity=".9"/><path d="M117 102 L 140 82 L 156 96 L 170 86 L 187 102 L 187 112 L 117 112z" fill="#ffffff" opacity=".5"/>
  <path d="M124 126 c0 -5 7 -6 8 -1 c1 -5 8 -4 8 1 c0 5 -8 9 -8 9 s-8 -4 -8 -9z" fill={p.accent}/>
  {bar(146,127,32,'#c3cbe6',5)}{bar(119,144,60)}{bar(119,155,46)}
  <rect x="119" y="170" width="66" height="22" rx="11" fill="#1d2b66"/>{bar(132,178,40,'#ffffff',5)}
  {slab({x:18,y:96,w:100,h:64,r:14,d:7})}
  <text x="31" y="124" fontFamily="Manrope, Arial, sans-serif" fontWeight="800" fontSize="20" fill="#13234f">+48%</text>
  <path d="M31 146 L 50 140 L 64 143 L 82 132 L 104 126" stroke={p.accent} strokeWidth="3" fill="none" strokeLinecap="round"/>
  {orb(238,78,24,'accent2')}
  <path d="M228 78 h14 m-4 -6 l6 6 l-6 6" stroke="#0b1430" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  {slab({x:206,y:144,w:76,h:42,r:13,d:6})}
  {orb(225,165,9,'accent')}{bar(240,159,32,'#1c2f63',5)}{bar(240,169,22)}
 </>,
 tech:({p,slab,u})=><>
  {slab({x:32,y:30,w:192,h:138,r:16,d:9})}
  <path d="M48 30 h160 a16 16 0 0 1 16 16 v8 H32 v-8 a16 16 0 0 1 16 -16z" fill="#dde5f8"/>
  {['#ff7a8a','#ffc75a','#39e0c3'].map((c,i)=><circle key={i} cx={48+i*10} cy="42" r="3.5" fill={c}/>)}
  <rect x="46" y="64" width="78" height="46" rx="9" fill={'url(#'+u('acc2Top')+')'} opacity=".75"/>{bar(134,68,72,'#1c2f63',6)}{bar(134,80,60)}{bar(134,91,66)}
  {[0,1,2].map(i=><rect key={i} x={46+i*58} y="120" width="50" height="34" rx="8" fill="#e8eeff"/>)}
  {slab({x:138,y:100,w:136,h:106,r:16,d:10,face:'ink'})}
  {([[152,120,34,p.accent],[192,120,40,'#94b7ff'],[164,134,52,'#cfc2ff'],[164,148,30,p.accent],[200,148,44,'#ffffff'],[152,162,28,'#94b7ff'],[186,162,48,p.accent],[164,176,40,'#cfc2ff']] as [number,number,number,string][]).map(([x,y,w,c],i)=><rect key={i} x={x} y={y} width={w} height="6" rx="3" fill={c} opacity=".92"/>)}
  <rect x="230" y="174" width="3" height="12" fill={p.accent}/>
  {slab({x:12,y:122,w:56,h:98,r:14,d:7,face:'ink'})}
  <rect x="18" y="129" width="44" height="84" rx="9" fill={'url(#'+u('glassTop')+')'}/><rect x="23" y="136" width="34" height="24" rx="6" fill={'url(#'+u('accTop')+')'}/>{bar(23,168,30)}{bar(23,178,22)}
 </>,
 'legal-finance':({slab,shadow,u})=><>
  <g transform="translate(10 0)">
   {shadow(86,206,40,7,.6)}
   <rect x="58" y="196" width="56" height="10" rx="5" fill={'url(#'+u('gold')+')'}/>
   <rect x="83" y="56" width="7" height="142" rx="3.5" fill={'url(#'+u('goldSide')+')'}/>
   <rect x="38" y="68" width="98" height="7" rx="3.5" fill={'url(#'+u('gold')+')'}/>
   <g stroke="#e9cf91" strokeWidth="1.6" opacity=".9"><path d="M42 74 L 26 120 M42 74 L 58 120"/><path d="M132 74 L 116 120 M132 74 L 148 120"/></g>
   <path d="M20 120 a22 11 0 0 0 44 0z" fill={'url(#'+u('gold')+')'}/><ellipse cx="42" cy="120" rx="22" ry="4" fill="#fff1c9"/>
   <path d="M110 120 a22 11 0 0 0 44 0z" fill={'url(#'+u('gold')+')'}/><ellipse cx="132" cy="120" rx="22" ry="4" fill="#fff1c9"/>
   <circle cx="86" cy="54" r="8" fill={'url(#'+u('gold')+')'}/><ellipse cx="83" cy="51" rx="3" ry="2" fill="#fff" opacity=".7"/>
  </g>
  <g transform="rotate(6 220 108)">
   {slab({x:166,y:34,w:110,h:148,r:12,d:8})}
   {bar(182,56,62,'#1c2f63',7)}{bar(182,74,80)}{bar(182,86,72)}{bar(182,98,80)}{bar(182,110,56)}
   <path d="M184 148 c8 -14 14 6 22 -6 s10 4 18 -4" stroke="#13234f" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
   <circle cx="248" cy="150" r="15" fill={'url(#'+u('gold')+')'}/><circle cx="248" cy="150" r="9" fill="none" stroke="#fff6dc" strokeWidth="2"/>
  </g>
  {shadow(200,224,34,6,.55)}
  {[0,1,2,3].map(i=><g key={i}><rect x="174" y={204-i*9} width="52" height="10" fill={'url(#'+u('goldSide')+')'}/><ellipse cx="200" cy={214-i*9} rx="26" ry="7" fill={'url(#'+u('goldSide')+')'}/><ellipse cx="200" cy={204-i*9} rx="26" ry="7" fill={'url(#'+u('gold')+')'}/></g>)}
  <ellipse cx="200" cy="177" rx="18" ry="4.5" fill="none" stroke="#fff4d6" strokeOpacity=".7"/>
 </>,
 creative:({slab,orb,u})=><>
  {slab({x:52,y:30,w:162,h:130,r:16,d:9})}
  <rect x="62" y="40" width="142" height="110" rx="10" fill="#ffe9db"/>
  <circle cx="164" cy="76" r="18" fill={'url(#'+u('orbB')+')'}/>
  <path d="M62 150 L 62 122 L 102 88 L 134 116 L 154 102 L 204 140 L 204 150z" fill={'url(#'+u('accTop')+')'}/>
  <path d="M62 150 L 62 136 L 120 116 L 170 138 L 204 128 L 204 150z" fill="#3b52d8" opacity=".85"/>
  <path d="M28 198 C 88 122, 170 232, 252 108" stroke="#ffffff" strokeWidth="2.5" fill="none"/>
  {[[28,198],[252,108]].map(([x,y],i)=><rect key={i} x={x-6} y={y-6} width="12" height="12" rx="2.5" fill="#ffffff" stroke="#3b52d8" strokeWidth="2"/>)}
  <path d="M140 168 L 182 150" stroke="#ffffff" strokeOpacity=".7" strokeWidth="1.5"/><circle cx="182" cy="150" r="4" fill="#ffffff"/>
  {orb(254,46,11,'accent')}{orb(254,76,11,'accent2')}{orb(254,106,11,'glass')}
  {slab({x:20,y:158,w:86,h:58,r:13,d:7,face:'ink'})}
  <circle cx="63" cy="187" r="14" fill="#ffffff" opacity=".16"/><path d="M58 179 L 71 187 L 58 195z" fill="#ffffff"/>
 </>,
 research:({p,slab,shadow,u})=><>
  {slab({x:28,y:34,w:216,h:148,r:16,d:9})}
  {bar(44,50,54,'#1c2f63',6)}{bar(44,62,34)}
  <g stroke="#dbe3f5" strokeWidth="1">{[92,116,140,164].map(y=><path key={y} d={'M44 '+y+' H 170'}/>)}</g>
  <path d="M44 156 L 68 144 L 92 148 L 116 122 L 140 128 L 168 98 L 168 166 L 44 166z" fill={p.accent} opacity=".18"/>
  <path d="M44 156 L 68 144 L 92 148 L 116 122 L 140 128 L 168 98" stroke="#2b5cde" strokeWidth="3" fill="none" strokeLinecap="round"/>
  {[[68,144],[116,122],[168,98]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4.5" fill="#ffffff" stroke="#2b5cde" strokeWidth="2.5"/>)}
  <circle cx="208" cy="92" r="22" fill="none" stroke="#e1e8f8" strokeWidth="10"/>
  <circle cx="208" cy="92" r="22" fill="none" stroke={'url(#'+u('acc2Top')+')'} strokeWidth="10" strokeDasharray="90 140" transform="rotate(-90 208 92)" strokeLinecap="round"/>
  {bar(186,130,44,'#1c2f63',5)}{bar(186,140,32)}
  {shadow(222,214,40,7,.5)}
  <circle cx="214" cy="168" r="34" fill="#ffffff" fillOpacity=".16"/>
  <circle cx="214" cy="168" r="34" fill="none" stroke={'url(#'+u('steel')+')'} strokeWidth="8"/>
  <path d="M238 194 L 264 220" stroke={'url(#'+u('inkTop')+')'} strokeWidth="13" strokeLinecap="round"/>
  <ellipse cx="200" cy="152" rx="12" ry="6" fill="#ffffff" opacity=".45" transform="rotate(-35 200 152)"/>
  <path d="M196 176 L 206 166 L 214 172 L 230 156" stroke={p.accent2Dark} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
 </>,
 commerce:({slab,shadow,u})=><>
  {slab({x:30,y:46,w:152,h:142,r:16,d:9})}
  <path d="M46 46 h120 a16 16 0 0 1 16 16 v14 H30 v-14 a16 16 0 0 1 16 -16z" fill={'url(#'+u('inkTop')+')'}/>
  {[0,1,2,3,4].map(i=><path key={i} d={'M'+(30+i*30.4)+' 76 h30.4 v6 a15.2 9 0 0 1 -30.4 0z'} fill={i%2?'#ffffff':'url(#'+u('accTop')+')'}/>)}
  {[0,1].map(i=><g key={i}><rect x={42+i*70} y="102" width="60" height="50" rx="9" fill={i?'#e6ecff':'#fff1dc'}/><rect x={55+i*70} y="112" width="34" height="28" rx="7" fill={'url(#'+u(i?'acc2Top':'accTop')+')'}/></g>)}
  {bar(42,162,40,'#1c2f63',5)}{bar(112,162,34,'#1c2f63',5)}{bar(42,172,26)}{bar(112,172,30)}
  {shadow(226,176,34,7,.55)}
  <path d="M196 92 h58 l7 78 h-72z" fill={'url(#'+u('accTop')+')'}/><path d="M196 92 h10 l-5 78 h-12z" fill="#ffffff" opacity=".22"/>
  <path d="M211 92 v-9 a14 14 0 0 1 28 0 v9" stroke="#fff7e6" strokeWidth="4" fill="none" strokeLinecap="round"/>
  {shadow(246,226,36,7,.55)}
  <path d="M212 186 l34 -14 l34 14 l-34 14z" fill="#ffe2b3"/><path d="M212 186 v28 l34 14 v-28z" fill="#e9ad5d"/><path d="M280 186 v28 l-34 14 v-28z" fill="#c98a3d"/>
  <path d="M229 179 l34 14 v8" stroke="#fff7e6" strokeOpacity=".8" strokeWidth="5" fill="none"/>
  {slab({x:18,y:198,w:106,h:28,r:14,d:4})}
  <circle cx="34" cy="212" r="8" fill="#22b07d"/><path d="M30.5 212 l2.5 2.5 l4.5 -4.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>{bar(48,209,60,'#1c2f63',6)}
 </>,
 education:({slab,shadow,u})=><>
  {shadow(150,180,108,10,.55)}
  <path d="M38 164 H 262 L 246 182 H 54z" fill={'url(#'+u('steel')+')'}/><path d="M54 182 H 246 L 244 186 H 56z" fill="#7d8fbf"/>
  {slab({x:58,y:36,w:184,h:124,r:12,d:4,face:'ink',shadow:false})}
  <rect x="66" y="44" width="168" height="108" rx="7" fill={'url(#'+u('glassTop')+')'}/>
  <rect x="74" y="52" width="98" height="64" rx="8" fill={'url(#'+u('accTop')+')'}/>
  <circle cx="123" cy="84" r="13" fill="#ffffff" opacity=".92"/><path d="M119 78 L 129 84 L 119 90z" fill="#13234f"/>
  {bar(74,126,98,'#dbe3f5',6)}<rect x="74" y="126" width="60" height="6" rx="3" fill="#2b5cde"/>
  {bar(182,56,44,'#1c2f63',6)}{bar(182,70,36)}{bar(182,82,42)}<rect x="182" y="96" width="44" height="18" rx="9" fill={'url(#'+u('acc2Top')+')'}/>
  <g transform="translate(54 30) rotate(-12)">
   {shadow(38,30,30,5,.45)}
   <path d="M14 6 v14 c12 8 36 8 48 0 v-14 L 38 14z" fill={'url(#'+u('inkTop')+')'}/>
   <path d="M0 0 L 38 -14 L 76 0 L 38 14z" fill={'url(#'+u('inkTop')+')'} stroke="#3a4f8a" strokeWidth="1"/>
   <path d="M38 -2 L 70 2 v20" stroke={'url(#'+u('gold')+')'} strokeWidth="2.5" fill="none"/><circle cx="70" cy="24" r="4.5" fill={'url(#'+u('gold')+')'}/>
  </g>
  {shadow(232,226,52,6,.5)}
  <path d="M180 202 q 26 -14 52 0 v24 q -26 -14 -52 0z" fill={'url(#'+u('glassTop')+')'}/><path d="M232 202 q 26 -14 52 0 v24 q -26 -14 -52 0z" fill="#e3eaff"/>
  <path d="M232 202 v24" stroke="#aebde3" strokeWidth="2"/>
 </>,
 wellbeing:({p,slab,orb,u})=><>
  {orb(228,62,30,'accent2')}
  <path d="M16 150 H 80 L 92 128 L 106 172 L 120 140 L 130 150 H 284" stroke={p.accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".95"/>
  {slab({x:42,y:48,w:142,h:76,r:20,d:8})}<path d="M70 123 v20 l20 -20z" fill={'url(#'+u('glassTop')+')'}/>
  {bar(60,68,82,'#1c2f63',6)}{bar(60,82,98)}{bar(60,94,72)}
  {slab({x:132,y:158,w:134,h:58,r:18,d:7,face:'accent'})}<path d="M236 215 v16 l-18 -16z" fill={'url(#'+u('accTop')+')'}/>
  {bar(148,176,76,'#ffffff',6)}{bar(148,190,52,'#ffffff',6)}
  <g transform="translate(36 206) rotate(-40)"><path d="M0 0 C 0 -26, 26 -36, 40 -32 C 40 -10, 22 6, 0 0z" fill={'url(#'+u('accTop')+')'}/><path d="M2 -2 L 36 -30" stroke="#ffffff" strokeOpacity=".7" strokeWidth="1.5"/></g>
 </>
};
scenes.legal=scenes['legal-finance'];
scenes.finance=scenes['legal-finance'];

export default function CategoryArt({art,label}:{art:string;label:string}){
 const scene=scenes[art]||scenes.ai;
 return <Stage art={art} label={label}>{scene}</Stage>;
}
