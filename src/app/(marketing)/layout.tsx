import { MarketingNavbar } from '@/components/layout/marketing-navbar';
import { SiteFooter } from '@/components/layout/site-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNavbar />
      {children}
      <SiteFooter />
    </>
  );
}
