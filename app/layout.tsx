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
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="mn" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:PRE_PAINT}}/></head><body><PartnerReferralCapture/>{children}</body></html>; }
