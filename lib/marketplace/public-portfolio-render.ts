import {creativeToolFor,brandLogoFor} from './creative-tools';

export type PublicPortfolioData={
 display_name:string;headline:string;bio:string;skills?:string|null;slug:string;avatar_path?:string|null;cover_path?:string|null;cover_focus_y?:number|null;
 portfolio:{title:string;object_path:string}[];
 services:{id:string;title:string;title_en:string;description:string;category?:string;price:number;delivery_days:number}[];
 tools?:({key:string;icon:string}|string)[];
};
export const escapePublicText=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||''));
const symbolPaths:Record<string,string>={
 figma:'<rect x="6" y="2" width="12" height="6" rx="3"/><rect x="6" y="8" width="12" height="6" rx="3"/><rect x="6" y="14" width="6" height="8" rx="3"/>',
 palette:'<circle cx="12" cy="12" r="9"/><circle cx="7.5" cy="12" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/><path d="M13 21c-2-1-2-5 1-5h4"/>',
 code:'<path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 16l9 5 9-5"/>',
 video:'<rect x="3" y="5" width="15" height="14" rx="2"/><path d="m18 10 4-3v10l-4-3"/>',
 sparkles:'<path d="m12 2 2.8 6.8L22 12l-7.2 3.2L12 22l-2.8-6.8L2 12l7.2-3.2L12 2Z"/>',
 chart:'<path d="M4 20V11M10 20V4M16 20V14M22 20V8M2 20h22"/>',
 camera:'<path d="M3 7h4l2-3h6l2 3h4v13H3V7Z"/><circle cx="12" cy="13" r="4"/>',
 file:'<path d="M5 2h9l5 5v15H5V2Z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
 wrench:'<path d="M21 7a6 6 0 0 1-8 6L7 20a3 3 0 0 1-4-4l7-7a6 6 0 0 1 6-8l-3 4 4 4 4-2Z"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m4 18 6-6 3 3 3-3 4 5"/>',
 pen:'<path d="m3 21 5-1 12-12-4-4L4 16l-1 5ZM14 6l4 4"/>',
 box:'<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10"/>',
 database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/>',
 table:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M10 4v16"/>',
 notebook:'<path d="M6 3h15v18H6zM3 6v2M3 11v2M3 16v2M10 8h7M10 12h7"/>',
 audio:'<path d="M3 10v4M7 6v12M11 2v20M15 7v10M19 4v16M23 10v4"/>'
};
const fallbackIcon:Record<string,string>={react:'sparkles',bot:'sparkles',file:'file'};
function svgIcon(name:string):string {
 const key=symbolPaths[name]?name:fallbackIcon[name]||'wrench';
 return '<svg class="portfolio-tool-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+symbolPaths[key]+'</svg>';
}
function currency(value:number):string {
 const safe=Number(value);
 return Number.isFinite(safe)&&safe>=0?new Intl.NumberFormat('mn-MN').format(safe)+' ₮':'—';
}
function getSkills(value:string|null|undefined):string[] {
 return Array.from(new Set(String(value||'').split(/[,;\n]/).map(s=>s.trim()).filter(s=>s.length>0).map(s=>s.slice(0,64)))).slice(0,16);
}
export function renderPublicSellerPage(p:PublicPortfolioData,{en,origin,url,title,description}:{en:boolean;origin:string;url:string;title:string;description:string}):string{
 const t=(mn:string,english:string)=>en?english:mn;
 const e=escapePublicText;
 const contact='/login/?mode=buyer&amp;seller='+encodeURIComponent(p.slug);
 const initials=String(p.display_name||'H').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x.charAt(0)).join('').toLocaleUpperCase()||'H';
 const avatarSrc=typeof p.avatar_path==='string'&&/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(p.avatar_path)?'/api/portfolio-image?path='+encodeURIComponent(p.avatar_path):null;
 const coverSrc=typeof p.cover_path==='string'&&/^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(p.cover_path)?'/api/portfolio-image?path='+encodeURIComponent(p.cover_path):null;
 const coverFocus=Number.isFinite(Number(p.cover_focus_y))?Math.min(100,Math.max(0,Math.round(Number(p.cover_focus_y)))):50;
 const photos=Array.isArray(p.portfolio)?p.portfolio:[];
 const services=Array.isArray(p.services)?p.services:[];
 const skills=getSkills(p.skills);
 const selection=Array.isArray(p.tools)?p.tools:[];
 const tools=selection.map(choice=>{
  const key=typeof choice==='string'?choice:typeof choice?.key==='string'?choice.key:'';
  const tool=creativeToolFor(key);
  const icon=typeof choice==='string'?'auto':choice?.icon||'auto';
  return tool?{tool,icon}:null;
 }).filter((x):x is NonNullable<typeof x>=>Boolean(x)).slice(0,16);
 const toolCards=tools.map(({tool,icon})=>{
  const logo=brandLogoFor(tool.key);
  const artwork=logo?'<img class="portfolio-brand-logo" src="'+e(logo)+'" alt="" width="32" height="32" loading="lazy" decoding="async">':svgIcon(tool.icon);
  const custom=icon!=='auto'?'<span class="portfolio-tool-custom-icon" title="'+e(t('Өөрчилсөн дүрс','Custom icon'))+'">'+svgIcon(icon)+'</span>':'';
  return '<li class="portfolio-tool-card"><span class="portfolio-tool-visual">'+artwork+'</span><span class="portfolio-tool-name">'+e(tool.name)+'</span>'+custom+'</li>';
 }).join('');
 const skillCards=skills.map(skill=>'<li class="portfolio-skill-chip"><span aria-hidden="true">✦</span>'+e(skill)+'</li>').join('');
 const portfolioCards=photos.map((item,i)=>{
  const src='/api/portfolio-image?path='+encodeURIComponent(item.object_path);
  const number=String(i+1).padStart(2,'0');
  return '<figure class="portfolio-project-card"><a href="'+src+'" target="_blank" rel="noreferrer noopener" aria-label="'+e(t('Бүтээлийн зургийг нээх: ','Open project image: ')+item.title)+'"><div class="portfolio-project-visual"><img src="'+src+'" loading="lazy" decoding="async" alt="'+e(item.title)+'"></div></a><figcaption><span class="portfolio-project-number">PROJECT '+number+'</span><strong>'+e(item.title)+'</strong><span class="portfolio-project-view">'+e(t('Зургийг нээх','View work'))+' ↗</span></figcaption></figure>';
 }).join('');
 const serviceCards=services.map((s,i)=>{
  const link='/listing/?id='+encodeURIComponent(s.id);
  const label=en&&s.title_en?s.title_en:s.title;
  return '<article class="portfolio-service-card"><span class="portfolio-service-index">0'+(i+1)+' / '+e(t('ҮЙЛЧИЛГЭЭ','SERVICE'))+'</span><h3>'+e(label)+'</h3><p>'+e(s.description||'')+'</p><div class="portfolio-service-footer"><div><small>'+e(t('Эхлэх үнэ','Starting at'))+'</small><strong>'+e(currency(s.price))+'</strong></div><span>'+e(String(s.delivery_days))+' '+e(t('хоног','days'))+'</span><a href="'+link+'">'+e(t('Үйлчилгээ үзэх','View service'))+' ↗</a></div></article>';
 }).join('');
 const heroBio=String(p.bio||'').trim();
 const nav='<nav class="portfolio-nav" aria-label="'+e(t('Профайлын цэс','Seller profile navigation'))+'"><a href="#about">'+e(t('Тухай','About'))+'</a><a href="#tools">'+e(t('Ур чадвар','Skills & tools'))+'</a><a href="#services">'+e(t('Үйлчилгээ','Services'))+'</a><a href="#projects">'+e(t('Бүтээлүүд','Projects'))+'</a><a href="#contact">'+e(t('Холбогдох','Contact'))+'</a></nav>';
 const header='<header class="portfolio-topbar"><div class="portfolio-topbar-inner"><a class="brand" href="/" aria-label="Linkup"><span class="linkup-wordmark" aria-hidden="true"></span></a>'+nav+'<div class="portfolio-topbar-actions"><a class="portfolio-lang" href="?lang='+(en?'mn':'en')+'">'+(en?'MN':'EN')+'</a><a class="portfolio-header-cta" href="'+contact+'">'+e(t('Хамтран ажиллах','Work together'))+' ↗</a></div></div></header>';
 const hero='<section class="portfolio-hero" id="top">'+(coverSrc?'<img class="v42-hero-cover-image" src="'+e(coverSrc)+'" alt="" style="object-position:center '+coverFocus+'%" loading="eager" decoding="async">':'')+'<div class="portfolio-hero-inner"><div class="portfolio-hero-copy"><span class="portfolio-kicker"><i></i> '+e(t('LINKUP / МЭРГЭЖИЛТЭН','LINKUP / INDEPENDENT CREATIVE'))+'</span><h1>'+e(t('Сайн байна уу, би','Hello, I’m'))+' <span>'+e(p.display_name)+'</span></h1><p class="portfolio-hero-role">'+e(p.headline||t('Чөлөөт мэргэжилтэн','Independent professional'))+'</p><p class="portfolio-hero-description">'+e(heroBio||t('Миний үйлчилгээнүүд болон бүтээлүүдтэй танилцаарай.','Explore my services and selected projects.'))+'</p><div class="portfolio-hero-actions"><a class="portfolio-cta-primary" href="#projects">'+e(t('Миний бүтээлүүд','View my work'))+' ↗</a><a class="portfolio-cta-outline" href="'+contact+'">'+e(t('Холбогдох','Get in touch'))+' ↗</a></div><div class="portfolio-hero-stats"><span><b>'+services.length+'</b>'+e(t('Нийтэлсэн үйлчилгээ','Published services'))+'</span><span><b>'+photos.length+'</b>'+e(t('Сонгосон бүтээл','Projects'))+'</span><span><b>'+tools.length+'</b>'+e(t('Ашигладаг хэрэгсэл','Tools'))+'</span></div></div><div class="portfolio-hero-visual"><div class="portfolio-visual-glow" aria-hidden="true"></div><div class="portfolio-hero-orbit" aria-hidden="true"><span class="portfolio-orbit-one">✳</span><span class="portfolio-orbit-two">✦</span><span class="portfolio-orbit-three">◈</span></div><div class="portfolio-hero-avatar" aria-label="'+e(p.display_name)+'">'+(avatarSrc?'<img src="'+e(avatarSrc)+'" alt="'+e(t('Профайлын зураг: ','Profile photo: ')+p.display_name)+'" width="250" height="250" decoding="async">':e(initials))+'</div><span class="portfolio-visual-label">'+e(t('БҮТЭЭЛҮҮД','CREATIVE PORTFOLIO'))+' <b>LINKUP</b></span></div></div></section>';
 const about='<section id="about" class="portfolio-section portfolio-about"><div class="portfolio-section-shell portfolio-about-grid"><div><span class="portfolio-label">01 / '+e(t('Миний тухай','ABOUT ME'))+'</span><h2>'+e(t('Танилцуулга','A little about me.'))+'</h2></div><div class="portfolio-about-copy"><p>'+e(heroBio||t('Өөрийн ур чадвар, туршлагаа энд танилцуулна.','This freelancer has not added a biography yet.'))+'</p><a href="'+contact+'" class="portfolio-text-link">'+e(t('Төслийн талаар ярилцах','Discuss a project'))+' ↗</a></div></div></section>';
 const toolsSection='<section id="tools" class="portfolio-section portfolio-toolkit"><div class="portfolio-section-shell"><div class="portfolio-section-title"><span class="portfolio-label">02 / '+e(t('Ур чадвар ба хэрэгсэл','SKILLS & TOOLKIT'))+'</span><h2>'+e(t('Ур чадвар & Технологи','Skills & technologies'))+'</h2><p>'+e(t('Мэргэжилтний сонгосон ур чадвар, ажилдаа ашигладаг програмууд.','Skills and software selected by this freelancer.'))+'</p></div>'+(skills.length?'<h3 class="portfolio-subheading">'+e(t('Миний ур чадвар','What I do'))+'</h3><ul class="portfolio-skills">'+skillCards+'</ul>':'')+(tools.length?'<h3 class="portfolio-subheading">'+e(t('Миний ашигладаг хэрэгслүүд','Tools I use'))+'</h3><ul class="portfolio-tool-grid">'+toolCards+'</ul>':'')+(!skills.length&&!tools.length?'<p class="portfolio-empty">'+e(t('Ур чадвар болон хэрэгслээ хараахан нэмээгүй байна.','Skills and tools have not been added yet.'))+'</p>':'')+'</div></section>';
 const servicesSection='<section id="services" class="portfolio-section portfolio-services"><div class="portfolio-section-shell"><div class="portfolio-section-title"><span class="portfolio-label">03 / '+e(t('Үйлчилгээ','MY SERVICES'))+'</span><h2>'+e(t('Миний санал болгох үйлчилгээ','How I can help.'))+'</h2><p>'+e(t('Зөвхөн нийтлэгдсэн, бодит үйлчилгээнүүд.','Only real, published services are shown.'))+'</p></div><div class="portfolio-service-grid">'+(serviceCards||'<p class="portfolio-empty">'+e(t('Одоогоор нийтэлсэн үйлчилгээ байхгүй.','No published services yet.'))+'</p>')+'</div></div></section>';
 const projectsSection='<section id="projects" class="portfolio-section portfolio-projects"><div class="portfolio-section-shell"><div class="portfolio-section-title"><span class="portfolio-label">04 / '+e(t('Бүтээлүүд','SELECTED WORK'))+'</span><h2>'+e(t('Миний бүтээлүүд','Projects & portfolio'))+'</h2><p>'+e(t('Мэргэжилтний нийтэд хуваалцахыг зөвшөөрсөн бодит бүтээлүүд.','Real projects that this freelancer opted to share publicly.'))+'</p></div><div class="portfolio-project-grid">'+(portfolioCards||'<p class="portfolio-empty">'+e(t('Бүтээл хараахан нэмээгүй байна.','No portfolio projects added yet.'))+'</p>')+'</div></div></section>';
 const contactSection='<section id="contact" class="portfolio-section portfolio-contact"><div class="portfolio-section-shell portfolio-contact-grid"><div><span class="portfolio-label">05 / '+e(t('ХОЛБОО БАРИХ','CONTACT'))+'</span><h2>'+e(t('Хамтдаа сайн ажил бүтээе.','Let’s build something great.'))+'</h2><p>'+e(t('Төслийнхөө талаар ярилцахыг хүсвэл Linkup дээрээс холбогдоорой.','Have a project in mind? Get in touch securely through Linkup.'))+'</p></div><div class="portfolio-contact-panel"><span class="portfolio-contact-mark">✳</span><h3>'+e(t('Төслөө эхлүүлэхэд бэлэн үү?','Ready to start your project?'))+'</h3><a href="'+contact+'">'+e(t('Мессеж илгээх','Send a message'))+' ↗</a><small>'+e(t('Нээлттэй бета — имэйлээ баталгаажуулсан бүртгэлээр холбогдоно. Бодит төлбөр идэвхгүй.','Open beta — sign in with an email-verified account to get in touch. No payments are collected.'))+'</small></div></div></section>';
 const footer='<footer class="portfolio-footer"><div class="portfolio-footer-inner"><a class="brand" href="/" aria-label="Linkup"><span class="linkup-wordmark" aria-hidden="true"></span></a><span>'+e(t('Монгол ур чадвар. Хязгааргүй боломж.','Local talent. Limitless possibilities.'))+'</span><a href="#top">'+e(t('Дээш очих','Back to top'))+' ↑</a></div></footer>';
 // V52: link previews show this freelancer (cover, else avatar) instead of the generic
 // Hustle card. Both go through the public, RLS-checked image route, so only images
 // the freelancer attached to an opted-in public profile can ever be shown.
 const shareImage=coverSrc||avatarSrc;
 const shareMeta=shareImage
  ?'<meta property="og:image" content="'+e(origin+shareImage)+'"><meta property="og:image:alt" content="'+e(p.display_name)+'"><meta name="twitter:card" content="'+(coverSrc?'summary_large_image':'summary')+'"><meta name="twitter:image" content="'+e(origin+shareImage)+'">'
  :'<meta property="og:image" content="'+e(origin+'/og/linkup.png')+'"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="'+e(origin+'/og/linkup.png')+'">';
 const shareTitle=p.headline?p.display_name+' · '+p.headline:title;
 const head='<!doctype html><html lang="'+(en?'en':'mn')+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+e(title)+'</title><meta name="description" content="'+e(description)+'"><link rel="canonical" href="'+e(url)+'"><meta property="og:type" content="profile"><meta property="og:title" content="'+e(shareTitle)+'"><meta name="twitter:title" content="'+e(shareTitle)+'"><meta name="twitter:description" content="'+e(description)+'"><meta property="og:description" content="'+e(description)+'"><meta property="og:url" content="'+e(url)+'"><meta property="og:site_name" content="Linkup"><meta property="og:locale" content="'+(en?'en_US':'mn_MN')+'">'+shareMeta+'<link rel="stylesheet" href="/public-profile.css"></head><body>';
 return head+header+'<main>'+hero+about+toolsSection+servicesSection+projectsSection+contactSection+'</main>'+footer+'</body></html>';
}
