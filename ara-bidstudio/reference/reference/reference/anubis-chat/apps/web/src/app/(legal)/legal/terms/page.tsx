import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | anubis.chat',
  description:
    'Terms of Service for anubis.chat, covering user obligations, subscriptions, wallet-based authentication, AI limitations, and dispute resolution.',
  alternates: { canonical: '/legal/terms' },
  robots: { index: true, follow: true },
};

const sections = [
  { id: 'introduction', title: '1. Introduction & Acceptance' },
  { id: 'eligibility', title: '2. Eligibility' },
  { id: 'account', title: '3. Accounts & Wallet Authentication' },
  { id: 'subscriptions', title: '4. Subscriptions, Payments & Refunds' },
  { id: 'ai', title: '5. Generative AI Output & Limitations' },
  { id: 'user-conduct', title: '6. Acceptable Use & Prohibited Conduct' },
  { id: 'ip', title: '7. Intellectual Property' },
  { id: 'privacy', title: '8. Privacy & Data' },
  { id: 'security', title: '9. Security & Wallet Responsibilities' },
  { id: 'third-parties', title: '10. Third-Party Services' },
  { id: 'termination', title: '11. Suspension & Termination' },
  { id: 'disclaimers', title: '12. Disclaimers; Limitation of Liability' },
  { id: 'indemnity', title: '13. Indemnification' },
  { id: 'changes', title: '14. Changes to the Service & Terms' },
  { id: 'law', title: '15. Governing Law, Disputes & Arbitration' },
  { id: 'contact', title: '16. Contact' },
];

export default function TermsOfServicePage() {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      <header className="mb-8">
        <h1 className="mb-2">Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric',
          })}
        </p>
      </header>

      <nav
        aria-label="Table of contents"
        className="mb-10 rounded-lg border bg-card p-4"
      >
        <h2 className="m-0 text-base">Contents</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                className="text-primary text-sm underline-offset-4 hover:underline"
                href={`#${s.id}`}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="introduction">
        <h2>1. Introduction & Acceptance</h2>
        <p>
          Welcome to anubis.chat (the “Service”). By accessing or using the
          Service, you agree to be bound by these Terms of Service (the
          “Terms”). If you do not agree, do not use the Service.
        </p>
      </section>

      <section id="eligibility">
        <h2>2. Eligibility</h2>
        <p>
          You must be the age of majority in your jurisdiction to use the
          Service. You represent and warrant you are not prohibited from using
          the Service under applicable law or sanctions.
        </p>
      </section>

      <section id="account">
        <h2>3. Accounts & Wallet Authentication</h2>
        <p>
          The Service uses Solana-compatible wallets for authentication. You are
          solely responsible for safeguarding your wallet, keys, seed phrases,
          and devices. We do not have access to or control over your private
          keys and cannot recover them. Any actions signed by your wallet are
          deemed authorized by you.
        </p>
      </section>

      <section id="subscriptions">
        <h2>4. Subscriptions, Payments & Refunds</h2>
        <p>
          Certain features require a paid subscription. Prices, features, and
          limits may change. Unless required by law or expressly stated
          otherwise, fees are non-refundable. You remain responsible for any
          on-chain transaction fees. Fraud monitoring and payment verification
          may be applied to mitigate abuse.
        </p>
      </section>

      <section id="ai">
        <h2>5. Generative AI Output & Limitations</h2>
        <p>
          AI outputs may be inaccurate, incomplete, or inappropriate. Do not
          rely on outputs as professional advice (including legal, medical, or
          financial). You are responsible for reviewing outputs for accuracy and
          legality before use. You must not submit or request content that
          violates law or third-party rights.
        </p>
      </section>

      <section id="user-conduct">
        <h2>6. Acceptable Use & Prohibited Conduct</h2>
        <ul>
          <li>No harassment, abuse, or hate speech.</li>
          <li>No malware, automated scraping, or denial-of-service.</li>
          <li>
            No attempts to bypass rate limits, security, or access controls.
          </li>
          <li>
            No infringement, misappropriation, or violation of third-party
            rights.
          </li>
          <li>No illegal activity under applicable law.</li>
        </ul>
      </section>

      <section id="ip">
        <h2>7. Intellectual Property</h2>
        <p>
          We own the Service, including software, branding, and content we
          provide, subject to open-source components under their respective
          licenses. You retain rights to your inputs and outputs, subject to
          applicable model and provider terms. You grant us a license to process
          your content to provide and improve the Service.
        </p>
      </section>

      <section id="privacy">
        <h2>8. Privacy & Data</h2>
        <p>
          Your use is subject to our Privacy Policy. We implement reasonable
          safeguards but cannot guarantee absolute security. Do not share
          sensitive personal information unless necessary. See our Privacy
          Policy for details.
        </p>
        <p>
          For more information, visit{' '}
          <Link className="underline underline-offset-4" href="/legal/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </section>

      <section id="security">
        <h2>9. Security & Wallet Responsibilities</h2>
        <p>
          You are responsible for device security, rotating compromised keys,
          and reviewing transactions before signing. We are not responsible for
          losses arising from lost credentials, phishing, or malicious software
          on your devices.
        </p>
      </section>

      <section id="third-parties">
        <h2>10. Third-Party Services</h2>
        <p>
          The Service integrates third-party AI providers and Solana
          infrastructure. Your use of those providers may be subject to their
          terms and policies.
        </p>
      </section>

      <section id="termination">
        <h2>11. Suspension & Termination</h2>
        <p>
          We may suspend or terminate access for violations of these Terms,
          risk, or to comply with law. Upon termination, your rights to use the
          Service cease, except for provisions that by their nature survive.
        </p>
      </section>

      <section id="disclaimers">
        <h2>12. Disclaimers; Limitation of Liability</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” WITHOUT WARRANTIES OF ANY KIND. TO THE
          MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL IMPLIED WARRANTIES
          AND LIMIT LIABILITY FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          OR EXEMPLARY DAMAGES.
        </p>
      </section>

      <section id="indemnity">
        <h2>13. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless anubis.chat and its
          affiliates from claims arising out of your use of the Service, your
          content, or your violation of these Terms or applicable law.
        </p>
      </section>

      <section id="changes">
        <h2>14. Changes to the Service & Terms</h2>
        <p>
          We may modify the Service and these Terms. We will update the “Last
          updated” date and may provide additional notice for material changes.
          Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section id="law">
        <h2>15. Governing Law, Disputes & Arbitration</h2>
        <p>
          These Terms are governed by applicable law where our primary operating
          entity is established, without regard to conflicts of laws principles.
          Disputes will be resolved through binding arbitration on an individual
          basis where permitted, and you waive class actions to the extent
          allowed by law.
        </p>
      </section>

      <section className="mb-0" id="contact">
        <h2>16. Contact</h2>
        <p>
          Questions about these Terms? Contact{' '}
          <a
            className="underline underline-offset-4"
            href="mailto:hello@anubis.chat"
          >
            hello@anubis.chat
          </a>
          .
        </p>
      </section>
    </article>
  );
}
