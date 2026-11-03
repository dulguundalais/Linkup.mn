import PartnerProgram from '../../components/partner-program';
import {PARTNER_PROGRAM_PUBLIC} from '../../lib/features';
// V80: while the program is hidden, Cloudflare sends /referrals/ to the home page
// (public/_redirects) and search engines are told not to index it.
export const metadata={title:'Түншлэлийн хөтөлбөр — Linkup',description:'Linkup Partner Program: automatic enrollment and referral tracking.',...(PARTNER_PROGRAM_PUBLIC?{}:{robots:{index:false,follow:false}})};
export default function Page(){return <PartnerProgram/>}
