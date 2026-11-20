import type {Metadata} from 'next';
import PremiumMarketplace from '../components/premium-marketplace';

const productionUrl = 'https://linkup.mn';
const pagesBranch = process.env.CF_PAGES_BRANCH;
// Preview links must point crawlers to the deployment that serves the preview image.
const previewUrl = pagesBranch && pagesBranch !== 'main' && pagesBranch !== 'feature/homepage-ui-v1'
  ? process.env.CF_PAGES_URL
  : undefined;
const homepageUrl = new URL('/', previewUrl || productionUrl);

export const metadata: Metadata = {
  openGraph: {
    type: 'website',
    url: homepageUrl,
    siteName: 'Linkup',
    title: 'Linkup — Төсөлдөө тохирох мэргэжилтнээ ол',
    description: 'Ажлын жишээ, үнэ, хугацааг харьцуулж, төсөлдөө тохирох хүнээ олоорой.',
    images: [{
      url: new URL('/og/linkup-home-v1.jpg', homepageUrl),
      width: 1200,
      height: 630,
      type: 'image/jpeg',
      alt: 'Linkup. Асуудал бүрт шийдэл бий.'
    }]
  }
};

export default function Home(){return <PremiumMarketplace/>}
