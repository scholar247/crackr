import { AnnouncementBar } from '@/components/layout/announcement-bar';
import { MarketingNavbar } from '@/components/layout/marketing-navbar';
import { SiteFooter } from '@/components/layout/site-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnnouncementBar />
      <MarketingNavbar />
      {children}
      <SiteFooter />
    </>
  );
}
