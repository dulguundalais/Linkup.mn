import type { Metadata } from 'next';
import './globals.css';
import PartnerReferralCapture from '../components/partner-referral-capture';
export const metadata: Metadata = { title: 'Linkup — Ур чадвар, боломжийг холбох газар', description: 'Монголын мэргэжилтнүүдийг захиалагчидтай холбох үйлчилгээний платформ.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="mn" suppressHydrationWarning><body><PartnerReferralCapture/>{children}</body></html>; }
