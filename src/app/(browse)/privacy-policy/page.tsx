import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the scholar247 Privacy Policy to understand how we collect, use, and protect your information, including our use of cookies and Google advertising services.',
  alternates: { canonical: '/privacy-policy' },
};

const LAST_UPDATED = 'June 21, 2026';
const EMAIL = 'join.scholar247@gmail.com';
const SITE = 'scholar247.org';
const SITE_NAME = 'scholar247';

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: {LAST_UPDATED} &nbsp;·&nbsp; Effective immediately upon publication
        </p>
      </div>

      <div className="space-y-10 text-sm leading-7 text-foreground/80">

        {/* 1 */}
        <Section title="1. Introduction">
          <p>
            {SITE_NAME} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website{' '}
            <strong>{SITE}</strong> (the &quot;Service&quot;). This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you visit our website. Please read this
            policy carefully. If you disagree with its terms, please discontinue use of the site.
          </p>
          <p>
            We reserve the right to make changes to this policy at any time. We will alert you about
            changes by updating the &quot;Last updated&quot; date. Continued use of the Service after
            changes constitutes your acceptance of those changes.
          </p>
        </Section>

        {/* 2 */}
        <Section title="2. Information We Collect">
          <p>We collect information in the following ways:</p>
          <SubHeading>2.1 Information you provide directly</SubHeading>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Google Sign-In:</strong> When you authenticate via Google OAuth, we receive your
              name, email address, and profile photo as provided by Google. We do not receive or store
              your Google password.
            </li>
            <li>
              <strong>Communications:</strong> Any messages you send us via email or contact forms.
            </li>
          </ul>
          <SubHeading>2.2 Information collected automatically</SubHeading>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Usage data:</strong> Questions attempted, answers selected, scores, time spent per
              question, mock test results, and topics visited.
            </li>
            <li>
              <strong>Device &amp; log data:</strong> IP address, browser type and version, operating
              system, referring URLs, pages viewed, and timestamps.
            </li>
            <li>
              <strong>Cookies and similar technologies:</strong> See Section 4 for full details.
            </li>
          </ul>
          <SubHeading>2.3 Information we do not collect</SubHeading>
          <p>
            We do not collect payment or financial information. {SITE_NAME} is free to use. We do not
            collect sensitive personal data such as government IDs, health data, or biometrics.
          </p>
        </Section>

        {/* 3 */}
        <Section title="3. How We Use Your Information">
          <p>We use the information we collect to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account and authenticate your identity.</li>
            <li>Personalise your learning experience — track progress, suggest weak topics, and show attempt history.</li>
            <li>Operate, maintain, and improve our platform and content quality.</li>
            <li>Send administrative notices (e.g. policy changes, security alerts). We do not send unsolicited marketing email.</li>
            <li>Monitor usage patterns to diagnose technical issues and prevent abuse.</li>
            <li>Serve relevant advertisements through Google AdSense (see Section 5).</li>
            <li>Comply with applicable laws and legal obligations.</li>
          </ul>
        </Section>

        {/* 4 */}
        <Section title="4. Cookies and Tracking Technologies">
          <p>
            We use cookies, local storage, and similar technologies on our website. By continuing to use
            the site you consent to our use of cookies in accordance with this policy.
          </p>
          <SubHeading>4.1 What are cookies?</SubHeading>
          <p>
            Cookies are small text files placed on your device by websites you visit. They are widely used
            to make websites work efficiently and to provide information to the site owners.
          </p>
          <SubHeading>4.2 Cookies we use</SubHeading>
          <table className="w-full border border-border rounded-lg overflow-hidden text-xs mt-2">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Type</th>
                <th className="text-left px-3 py-2 font-semibold">Purpose</th>
                <th className="text-left px-3 py-2 font-semibold">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['Essential / Session', 'Keep you signed in and maintain session state', 'Session or up to 30 days'],
                ['Preference', 'Remember theme (light/dark) and UI settings', 'Up to 1 year'],
                ['Analytics (Google Analytics)', 'Measure traffic, page views, and user journeys (anonymised)', 'Up to 2 years'],
                ['Advertising (Google AdSense)', 'Serve personalised ads based on browsing behaviour; measure ad performance', 'Up to 2 years'],
              ].map(([type, purpose, duration]) => (
                <tr key={type}>
                  <td className="px-3 py-2 font-medium">{type}</td>
                  <td className="px-3 py-2 text-muted-foreground">{purpose}</td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <SubHeading>4.3 How to control cookies</SubHeading>
          <p>
            You can control and delete cookies through your browser settings. Note that disabling cookies
            may prevent you from signing in or using certain features. Browser-specific instructions:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><a href="https://support.google.com/chrome/answer/95647" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/en-us/windows/delete-and-manage-cookies" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
          </ul>
        </Section>

        {/* 5 */}
        <Section title="5. Google AdSense and Advertising">
          <p>
            We use <strong>Google AdSense</strong> to display advertisements on our website. Google
            AdSense uses cookies, including the <strong>DoubleClick DART cookie</strong>, to serve ads
            based on your prior visits to this and other websites.
          </p>
          <SubHeading>5.1 How Google uses your data for ads</SubHeading>
          <p>
            Google, as a third-party vendor, uses cookies to serve ads on our site. Google&apos;s use of
            the DART cookie enables it to serve ads to users based on their visit to {SITE} and other
            sites on the Internet. Users may opt out of the use of the DART cookie by visiting the{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Ad Settings page
            </a>
            .
          </p>
          <SubHeading>5.2 Personalised vs. non-personalised ads</SubHeading>
          <p>
            By default, Google AdSense may serve personalised ads based on your browsing history. You can
            opt out of personalised advertising at any time:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Visit{' '}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google Ad Settings
              </a>
            </li>
            <li>
              Use the{' '}
              <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Network Advertising Initiative opt-out page
              </a>
            </li>
            <li>
              Use the{' '}
              <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Digital Advertising Alliance opt-out page
              </a>
            </li>
          </ul>
          <SubHeading>5.3 Third-party ad technology</SubHeading>
          <p>
            Our advertising partners may use cookies, web beacons, and similar technologies to collect
            information about your interactions with our site and other websites to provide you with
            targeted advertising. This data is collected and processed according to the privacy policies of
            those partners, principally{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
          <p>
            We do not control or have access to the data that third-party advertisers collect about you
            through our site. Please review the privacy policies of those third parties for more
            information.
          </p>
        </Section>

        {/* 6 */}
        <Section title="6. Third-Party Services">
          <p>The following third-party services process data in connection with our Service:</p>
          <table className="w-full border border-border rounded-lg overflow-hidden text-xs mt-2">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Service</th>
                <th className="text-left px-3 py-2 font-semibold">Purpose</th>
                <th className="text-left px-3 py-2 font-semibold">Privacy Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ['Google OAuth', 'Authentication', 'https://policies.google.com/privacy'],
                ['Google AdSense', 'Advertising', 'https://policies.google.com/privacy'],
                ['Google Analytics', 'Usage analytics', 'https://policies.google.com/privacy'],
                ['MongoDB Atlas', 'Data storage', 'https://www.mongodb.com/legal/privacy-policy'],
              ].map(([service, purpose, policy]) => (
                <tr key={service}>
                  <td className="px-3 py-2 font-medium">{service}</td>
                  <td className="px-3 py-2 text-muted-foreground">{purpose}</td>
                  <td className="px-3 py-2">
                    <a href={policy} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      View policy
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* 7 */}
        <Section title="7. Data Sharing and Disclosure">
          <p>We do not sell, rent, or trade your personal information. We may share it only in these limited circumstances:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Service providers:</strong> Trusted vendors (listed in Section 6) who help operate our Service under strict confidentiality agreements.</li>
            <li><strong>Legal compliance:</strong> When required by law, court order, or government authority.</li>
            <li><strong>Protection of rights:</strong> To protect the rights, property, or safety of {SITE_NAME}, our users, or others.</li>
            <li><strong>Business transfer:</strong> In connection with a merger, acquisition, or sale of assets, with prior notice to you.</li>
          </ul>
        </Section>

        {/* 8 */}
        <Section title="8. Data Retention">
          <p>
            We retain your personal data for as long as your account remains active or as needed to
            provide the Service. Upon account deletion, we will remove or anonymise your personal data
            within 30 days, unless retention is required by law (e.g. tax records) or for legitimate
            business purposes (e.g. fraud prevention).
          </p>
          <p>
            Aggregated, anonymised usage statistics (which cannot identify you) may be retained
            indefinitely for product improvement purposes.
          </p>
        </Section>

        {/* 9 */}
        <Section title="9. Data Security">
          <p>
            We implement industry-standard safeguards including HTTPS/TLS encryption in transit,
            encrypted data storage, access controls, and regular security reviews. However, no method of
            transmission over the Internet or electronic storage is 100% secure. We cannot guarantee
            absolute security and encourage you to use a strong, unique password.
          </p>
        </Section>

        {/* 10 */}
        <Section title="10. Children's Privacy (COPPA)">
          <p>
            Our Service is intended for users aged <strong>13 and above</strong>. We do not knowingly
            collect personal information from children under 13 years of age. If you are a parent or
            guardian and believe your child has provided us with personal information without your
            consent, please contact us immediately at{' '}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a> and we
            will delete the information within 30 days.
          </p>
        </Section>

        {/* 11 */}
        <Section title="11. Your Privacy Rights">
          <p>Depending on your location, you may have the following rights:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Access:</strong> Request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data.</li>
            <li><strong>Deletion:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;).</li>
            <li><strong>Restriction:</strong> Object to or request restriction of certain processing.</li>
            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
            <li><strong>Withdraw consent:</strong> Withdraw consent for processing where consent is the legal basis.</li>
          </ul>
          <p>
            To exercise any of these rights, email us at{' '}
            <a href={`mailto:${EMAIL}`} className="text-primary hover:underline">{EMAIL}</a>. We will
            respond within 30 days. We may need to verify your identity before processing your request.
          </p>
          <SubHeading>EU/EEA Users (GDPR)</SubHeading>
          <p>
            If you are in the European Union or European Economic Area, our legal basis for processing
            your data is: (a) performance of a contract (providing the Service), (b) legitimate interests
            (security, fraud prevention, product improvement), or (c) your consent (advertising cookies).
            You have the right to lodge a complaint with your national data protection authority.
          </p>
          <SubHeading>California Residents (CCPA)</SubHeading>
          <p>
            California residents may request disclosure of the categories and specific pieces of personal
            information we have collected, the sources, the business purposes, and any third parties with
            whom we shared it. We do not sell personal information as defined under the CCPA.
          </p>
        </Section>

        {/* 12 */}
        <Section title="12. Links to Other Websites">
          <p>
            Our Service may contain links to third-party websites. We have no control over and assume no
            responsibility for the content, privacy policies, or practices of any third-party sites. We
            encourage you to review the privacy policy of every site you visit.
          </p>
        </Section>

        {/* 13 */}
        <Section title="13. Changes to This Policy">
          <p>
            We may update this Privacy Policy periodically. Material changes will be announced by updating
            the &quot;Last updated&quot; date at the top of this page. For significant changes, we may also
            send a notification to your registered email address. Your continued use of the Service after
            the effective date constitutes acceptance of the revised policy.
          </p>
        </Section>

        {/* 14 */}
        <Section title="14. Contact Us">
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data
            practices, please contact us:
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

        <div className="border-t border-border pt-6 text-xs text-muted-foreground space-y-1">
          <p>
            See also:{' '}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-foreground mt-3">{children}</h3>;
}
