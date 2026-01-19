import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | anubis.chat',
  description:
    'Cookie Policy describing how anubis.chat uses cookies and similar technologies, and how you can control them.',
  alternates: { canonical: '/legal/cookies' },
  robots: { index: true, follow: true },
};

const sections = [
  { id: 'overview', title: '1. Overview' },
  { id: 'what-are-cookies', title: '2. What Are Cookies?' },
  { id: 'how-we-use', title: '3. How We Use Cookies' },
  { id: 'types', title: '4. Types of Cookies We Use' },
  { id: 'manage', title: '5. Managing Cookies' },
  { id: 'changes', title: '6. Changes' },
  { id: 'contact', title: '7. Contact' },
];

export default function CookiePolicyPage() {
  return (
    <article className="prose prose-zinc dark:prose-invert max-w-none">
      <header className="mb-8">
        <h1 className="mb-2">Cookie Policy</h1>
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
          This Cookie Policy explains how anubis.chat uses cookies and similar
          technologies.
        </p>
      </section>

      <section id="what-are-cookies">
        <h2>2. What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your device by websites you
          visit. They help websites function and provide analytics, preferences,
          and security features.
        </p>
      </section>

      <section id="how-we-use">
        <h2>3. How We Use Cookies</h2>
        <ul>
          <li>Essential cookies for authentication and core functionality.</li>
          <li>Preference cookies to remember settings like theme.</li>
          <li>
            Analytics cookies to understand usage and improve the Service.
          </li>
          <li>
            Security cookies to prevent abuse and maintain service quality.
          </li>
        </ul>
      </section>

      <section id="types">
        <h2>4. Types of Cookies We Use</h2>
        <ul>
          <li>Session and persistent cookies.</li>
          <li>First-party cookies set by anubis.chat.</li>
          <li>
            Third-party cookies set by service providers (subject to their
            policies).
          </li>
        </ul>
      </section>

      <section id="manage">
        <h2>5. Managing Cookies</h2>
        <p>
          You can control cookies through your browser settings. Disabling
          certain cookies may affect functionality. Some browsers support Global
          Privacy Control (GPC) signals.
        </p>
      </section>

      <section id="changes">
        <h2>6. Changes</h2>
        <p>
          We may update this Policy. We will update the “Last updated” date and
          may provide additional notice for material changes.
        </p>
      </section>

      <section className="mb-0" id="contact">
        <h2>7. Contact</h2>
        <p>
          Questions? Contact{' '}
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
