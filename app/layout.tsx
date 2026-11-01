import type { Metadata } from 'next';
import './globals.css';
import './v57-motion.css';
import './v58-mobile-touch.css';
import PartnerReferralCapture from '../components/partner-referral-capture';
export const metadata: Metadata = { title: 'Linkup — Ур чадвар, боломжийг холбох газар', description: 'Монголын мэргэжилтнүүдийг захиалагчидтай холбох үйлчилгээний платформ.' };
// V65: before the page paints, use the saved theme for the page background and
// hold back colour transitions for a moment, so dark-mode visitors do not see a
// white page fade to dark on every load.
const PRE_PAINT="(function(){var d=document.documentElement;d.classList.add('v65-loading');try{if(localStorage.getItem('hustle-theme')==='dark')d.classList.add('v65-pre-dark')}catch(e){}setTimeout(function(){d.classList.remove('v65-loading')},3000)})()";
// V68: these first-load rules sit inline so they apply on every page before any
// stylesheet arrives. In dark mode the pre-built (light) page stays hidden on the
// dark background until it switches to dark; the guard ends within 3 s at most.
const PRE_PAINT_CSS="html.v65-pre-dark,html.v65-pre-dark body{background:#050c22;color-scheme:dark}html.v65-loading .hustle-v5,html.v65-loading .hustle-v5 *{transition:none!important}html.v65-pre-dark.v65-loading body>:is(.hustle-v5,.v50-listing-page):not(.night){visibility:hidden}";
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="mn" suppressHydrationWarning><head><style dangerouslySetInnerHTML={{__html:PRE_PAINT_CSS}}/><script dangerouslySetInnerHTML={{__html:PRE_PAINT}}/></head><body><PartnerReferralCapture/>{children}</body></html>; }
