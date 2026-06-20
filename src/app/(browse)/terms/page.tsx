import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Read the scholar247 Terms of Service to understand the rules and guidelines governing your use of our exam preparation platform.',
};

const LAST_UPDATED = 'June 21, 2026';
const EMAIL = 'join.scholar247@gmail.com';
const SITE = 'scholar247.org';
const SITE_NAME = 'scholar247';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED} &nbsp;·&nbsp; Please read these terms carefully before using {SITE_NAME}.
        </p>
      </div>

      <div className="space-y-10 text-sm leading-7 text-foreground/80">

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the {SITE_NAME} website at{' '}
            <a href={`https://${SITE}`} className="text-primary hover:underline">{SITE}</a> (the
            &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;) and our{' '}
            <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
            If you do not agree to these Terms, do not use the Service.
          </p>
          <p>
            These Terms apply to all visitors, registered users, and any others who access the Service.
            We reserve the right to update these Terms at any time. Continued use after changes are
            posted constitutes your acceptance of the revised Terms.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            {SITE_NAME} is a free online exam preparation platform that provides:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Multiple-choice question (MCQ) practice banks mapped to competitive exams.</li>
            <li>Previous year question papers (PYP) for various entrance exams.</li>
            <li>Mock tests and timed practice sessions.</li>
            <li>Progress tracking, accuracy analytics, and topic-level insights.</li>
            <li>Educational content including explanations and hints.</li>
          </ul>
          <p>
            We reserve the right to modify, suspend, or discontinue any part of the Service at any time
            without notice.
          </p>
        </Section>

        <Section title="3. User Accounts and Registration">
          <p>
            Some features require you to create an account. You may register using Google OAuth. By
            creating an account you agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Provide accurate and complete information during registration.</li>
            <li>Maintain the security of your account and immediately notify us of any unauthorised use.</li>
            <li>Be responsible for all activity that occurs under your account.</li>
            <li>Not create more than one account per person.</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these Terms or that we
            believe are being used for fraudulent or harmful purposes.
          </p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Reproduce, distribute, or commercially exploit any content from the Service without our written permission.</li>
            <li>Use any automated tool (bots, scrapers, crawlers) to extract content or data from the Service.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service or its servers.</li>
            <li>Attempt to gain unauthorised access to any portion of the Service or its related systems.</li>
            <li>Transmit any unsolicited advertising, spam, or promotional material.</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
            <li>Post, share, or transmit content that is unlawful, harmful, offensive, or violates any third-party rights.</li>
            <li>Use the Service in any way that could damage, overburden, or impair the Service.</li>
          </ul>
          <p>
            Violation of these rules may result in immediate suspension or termination of your access
            without notice.
          </p>
        </Section>

        <Section title="5. Intellectual Property">
          <p>
            All content on {SITE_NAME} — including but not limited to questions, explanations, text,
            graphics, logos, icons, and software — is the property of {SITE_NAME} or its content
            suppliers and is protected by applicable copyright, trademark, and intellectual property laws.
          </p>
          <p>
            We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use
            the Service for your personal, non-commercial educational purposes only. This licence does not
            include the right to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Resell or commercially exploit the Service or its content.</li>
            <li>Download or copy content (other than incidental page caching).</li>
            <li>Modify or create derivative works from any content.</li>
            <li>Use data mining, robots, or similar data gathering and extraction tools.</li>
          </ul>
        </Section>

        <Section title="6. User-Generated Content">
          <p>
            The Service does not currently support public user-generated content. Any feedback, suggestions,
            or ideas you submit to us by email or other means are non-confidential and may be used by us
            without compensation or attribution to you.
          </p>
        </Section>

        <Section title="7. Advertisements">
          <p>
            The Service displays advertisements served by <strong>Google AdSense</strong> and potentially
            other advertising networks. These advertisements help us keep the Service free for all users.
          </p>
          <p>
            We are not responsible for the content of third-party advertisements or for any products or
            services advertised. Clicking on advertisements is at your own risk. Please review the
            advertiser&apos;s website and terms before making any purchases or sharing personal information.
          </p>
          <p>
            Google may use cookies and similar technologies to serve ads based on your prior visits to
            this website and other websites. For more information or to opt out, visit{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Ad Settings
            </a>
            .
          </p>
        </Section>

        <Section title="8. Disclaimer of Warranties">
          <p>
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT
            WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            We do not warrant that: (a) the Service will be uninterrupted or error-free; (b) defects will
            be corrected; (c) the Service or its servers are free of viruses or other harmful components;
            or (d) the content on the Service is accurate, complete, or up to date. Content is for
            educational practice purposes and should not be treated as definitive examination guidance.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, {SITE_NAME.toUpperCase()} AND ITS
            OPERATORS, AFFILIATES, LICENSORS, AND SERVICE PROVIDERS SHALL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED
            TO LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your access to or use of (or inability to access or use) the Service.</li>
            <li>Any content obtained from the Service.</li>
            <li>Unauthorised access to or alteration of your transmissions or data.</li>
            <li>Conduct of any third party on or through the Service.</li>
          </ul>
          <p>
            Our total liability to you for any claim arising out of or relating to these Terms or the
            Service shall not exceed INR 1,000 (or equivalent in your local currency).
          </p>
        </Section>

        <Section title="10. Indemnification">
          <p>
            You agree to defend, indemnify, and hold harmless {SITE_NAME} and its operators from any
            claims, damages, liabilities, costs, and expenses (including reasonable legal fees) arising
            from: (a) your use of the Service; (b) your violation of these Terms; or (c) your violation
            of any third-party rights.
          </p>
        </Section>

        <Section title="11. Third-Party Links and Services">
          <p>
            The Service may contain links to third-party websites, advertisers, or services that are not
            owned or controlled by {SITE_NAME}. We have no control over and assume no responsibility for
            the content, privacy policies, or practices of any third-party websites. We strongly advise
            you to review the Terms and Privacy Policy of any third-party site you visit.
          </p>
        </Section>

        <Section title="12. Termination">
          <p>
            We may terminate or suspend your account and access to the Service at our sole discretion,
            without prior notice or liability, for any reason, including if you breach these Terms.
          </p>
          <p>
            Upon termination, your right to use the Service will immediately cease. All provisions of
            these Terms that by their nature should survive termination shall survive, including ownership
            provisions, warranty disclaimers, indemnity, and limitations of liability.
          </p>
          <p>
            You may delete your account at any time by contacting us at{' '}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>.
          </p>
        </Section>

        <Section title="13. Governing Law and Dispute Resolution">
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, without
            regard to conflict-of-law provisions. Any dispute arising from or relating to these Terms or
            the Service shall be subject to the exclusive jurisdiction of the courts located in India.
          </p>
          <p>
            Before initiating any legal action, you agree to first contact us at{' '}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a> and give
            us 30 days to attempt to resolve the dispute informally.
          </p>
        </Section>

        <Section title="14. Contact Information">
          <p>
            For questions about these Terms, please contact us:
          </p>
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-1 mt-3">
            <p><strong>{SITE_NAME}</strong></p>
            <p>
              Email:{' '}
              <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">
                {EMAIL}
              </a>
            </p>
            <p>Website: <a href={`https://${SITE}`} className="text-primary hover:underline">{SITE}</a></p>
          </div>
        </Section>

        <div className="border-t border-border pt-6 text-xs text-muted-foreground">
          <p>
            See also:{' '}
            <Link href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>
            {' '}·{' '}
            <Link href="/about" className="text-primary hover:underline">About Us</Link>
            {' '}·{' '}
            <Link href="/contact" className="text-primary hover:underline">Contact</Link>
          </p>
        </div>

      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}
