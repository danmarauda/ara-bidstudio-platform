'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

export default function BreadcrumbSchema() {
  const pathname = usePathname();

  // Generate breadcrumb items based on the current path
  const generateBreadcrumbs = (path: string) => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://anubis.chat',
      },
    ];

    segments.forEach((segment, index) => {
      const url = `https://anubis.chat/${segments.slice(0, index + 1).join('/')}`;
      const name =
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      breadcrumbs.push({
        '@type': 'ListItem',
        position: index + 2,
        name,
        item: url,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: generateBreadcrumbs(pathname),
  };

  // Only show breadcrumbs on non-home pages
  if (pathname === '/') {
    return null;
  }

  return (
    <Script id="breadcrumb-schema" type="application/ld+json">
      {JSON.stringify(breadcrumbSchema)}
    </Script>
  );
}
