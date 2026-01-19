import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | anubis.chat',
  description:
    'Privacy Policy describing how anubis.chat collects, uses, and safeguards data, including wallet-based authentication and AI interactions.',
  alternates: { canonical: '/legal/privacy' },
  robots: { index: true, follow: true },
};

const sections = [
  { id: 'overview', title: '1. Overview' },
  { id: 'data-we-collect', title: '2. Data We Collect' },
  { id: 'how-we-use', title: '3. How We Use Data' },
  { id: 'ai-data', title: '4. AI Inputs & Outputs' },
  { id: 'sharing', title: '5. Sharing & Disclosures' },
  { id: 'security', title: '6. Security' },
  { id: 'retention', title: '7. Data Retention' },
  { id: 'choices', title: '8. Your Choices & Rights' },
  { id: 'children', title: '9. Children’s Privacy' },
  { id: 'changes', title: '10. Changes' },
  { id: 'contact', title: '11. Contact' },
];

export default function PrivacyPolicyPage() {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      <header className="mb-8">
        <h1 className="mb-2">Privacy Policy</h1>
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

      <section id="overview">
        <h2>1. Overview</h2>
        <p>
          This Privacy Policy explains how anubis.chat (the “Service”) collects,
          uses, and safeguards information. By using the Service, you consent to
          this Policy.
        </p>
      </section>

      <section id="data-we-collect">
        <h2>2. Data We Collect</h2>
        <ul>
          <li>
            Wallet public keys and basic session metadata for authentication.
          </li>
          <li>
            Usage data such as interactions, device/browser information, and
            event logs.
          </li>
          <li>Content you provide as inputs and generated outputs.</li>
          <li>Subscription/payment status and related verification details.</li>
        </ul>
      </section>

      <section id="how-we-use">
        <h2>3. How We Use Data</h2>
        <ul>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Authenticate sessions and secure accounts.</li>
          <li>Detect and prevent abuse, fraud, and security incidents.</li>
          <li>
            Communicate with you regarding updates, support, and service
            notices.
          </li>
        </ul>
      </section>

      <section id="ai-data">
        <h2>4. AI Inputs & Outputs</h2>
        <p>
          AI providers may process your prompts and outputs to deliver results
          and improve models subject to their policies. Avoid submitting
          sensitive personal information. We apply reasonable safeguards but
          cannot guarantee absolute confidentiality when content is processed by
          third-party providers.
        </p>
      </section>

      <section id="sharing">
        <h2>5. Sharing & Disclosures</h2>
        <p>
          We share data with service providers to operate the Service (e.g., AI
          model providers, infrastructure), in connection with legal
          obligations, to prevent harm, or with your consent.
        </p>
      </section>

      <section id="security">
        <h2>6. Security</h2>
        <p>
          We implement technical and organizational measures designed to protect
          information. No method of transmission or storage is 100% secure.
        </p>
      </section>

      <section id="retention">
        <h2>7. Data Retention</h2>
        <p>
          We retain information for as long as necessary to provide the Service,
          comply with legal obligations, resolve disputes, and enforce
          agreements.
        </p>
      </section>

      <section id="choices">
        <h2>8. Your Choices & Rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access,
          correct, delete, or restrict processing of your data. Contact us to
          exercise these rights.
        </p>
      </section>

      <section id="children">
        <h2>9. Children’s Privacy</h2>
        <p>
          The Service is not directed to children. We do not knowingly collect
          personal information from children.
        </p>
      </section>

      <section id="changes">
        <h2>10. Changes</h2>
        <p>
          We may update this Policy from time to time. We will update the “Last
          updated” date and may provide additional notice for material changes.
        </p>
      </section>

      <section className="mb-0" id="contact">
        <h2>11. Contact</h2>
        <p>
          Questions about this Policy? Contact{' '}
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
