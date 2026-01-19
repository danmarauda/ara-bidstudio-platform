# Design Document

## Overview

This design document outlines the comprehensive documentation architecture for Anubis Chat using Fumadocs. The design focuses on creating a user-friendly, well-organized, and technically robust documentation site that serves multiple audiences while leveraging Fumadocs' powerful features and the existing monorepo structure.

## Architecture

### Information Architecture

The documentation follows a hierarchical structure designed to guide users from basic concepts to advanced implementation:

```
Anubis Chat Documentation
├── Getting Started
│   ├── Introduction
│   ├── Quick Start
│   └── Wallet Setup
├── Features
│   ├── AI Models
│   ├── Document RAG
│   ├── Chat History
│   └── Sharing & Referrals
├── Subscriptions
│   ├── Pricing
│   ├── SOL Payments
│   └── Billing Management
├── Developer Guides
│   ├── Architecture Overview
│   ├── Open Source
│   ├── Local Development
│   ├── Contributing
│   └── Deployment
└── Roadmap
    ├── Overview
    ├── API Reference (Coming Soon)
    │   ├── Authentication
    │   ├── Chat Endpoints
    │   ├── Document Endpoints
    │   └── User Management
    ├── MCP Servers (Coming Soon)
    ├── Workflows (Coming Soon)
    ├── Memories System (Coming Soon)
    └── Community Feedback
```

### Technical Architecture

#### Fumadocs Configuration
- **Framework**: Fumadocs with Next.js 15 and React 19
- **Content Source**: MDX files in `/apps/fumadocs/content/docs/`
- **Styling**: Tailwind CSS with Fumadocs UI components
- **Search**: Built-in Fumadocs search with Orama integration
- **Navigation**: Auto-generated from file structure with custom meta.json files

#### Content Management
- **File Structure**: Organized by feature/topic with logical nesting
- **Frontmatter Schema**: Extended Zod schema for custom metadata
- **Asset Management**: Images and media in `/public/docs/` directory
- **Code Examples**: Syntax-highlighted with copy-to-clipboard functionality

## Components and Interfaces

### Core Page Components

#### Landing Page (`/`)
- Hero section with platform overview
- Open source badge and GitHub links
- Feature highlights with interactive cards
- Quick start CTA
- Navigation to key sections

#### Section Index Pages
- Overview of section contents
- Navigation cards to subsections
- Progress indicators for multi-step guides
- Related links and cross-references

#### Content Pages
- Consistent layout with DocsPage component
- Table of contents for long pages
- Previous/next navigation
- Edit on GitHub links

### Interactive Components

#### Code Examples
```tsx
// Using Fumadocs code blocks with tabs
<Tabs items={['TypeScript', 'JavaScript']}>
  <Tab value="typescript">
    ```ts
    // TypeScript example
    ```
  </Tab>
  <Tab value="javascript">
    ```js
    // JavaScript example
    ```
  </Tab>
</Tabs>
```

#### File Structure Display
```tsx
// Using Fumadocs Files component
<Files>
  <Folder name="apps" defaultOpen>
    <Folder name="web">
      <File name="page.tsx" />
    </Folder>
    <Folder name="fumadocs">
      <File name="content/" />
    </Folder>
  </Folder>
</Files>
```

#### Step-by-Step Guides
```tsx
// Using Fumadocs Steps component
<Steps>
  <Step>
    ### Connect Your Wallet
    Instructions for wallet connection...
  </Step>
  <Step>
    ### Start Your First Chat
    Guide to initiating conversation...
  </Step>
</Steps>
```

## Data Models

### Frontmatter Schema
```typescript
const customFrontmatterSchema = frontmatterSchema.extend({
  // Standard fields
  title: z.string(),
  description: z.string(),
  
  // Custom fields
  category: z.enum(['getting-started', 'features', 'api', 'guides', 'roadmap']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tags: z.array(z.string()).optional(),
  lastUpdated: z.string().date().optional(),
  author: z.string().optional(),
  
  // Feature flags
  comingSoon: z.boolean().default(false),
  beta: z.boolean().default(false),
  
  // SEO
  ogImage: z.string().optional(),
  canonical: z.string().optional(),
});
```

### Navigation Structure
```typescript
interface NavigationItem {
  title: string;
  href: string;
  description?: string;
  icon?: string;
  badge?: 'new' | 'beta' | 'coming-soon';
  children?: NavigationItem[];
}
```

### Content Categories
```typescript
type ContentCategory = 
  | 'getting-started'
  | 'features' 
  | 'subscriptions'
  | 'developer-guides'
  | 'roadmap';
```

## Error Handling

### 404 Pages
- Custom 404 page with helpful navigation
- Search suggestions for similar content
- Links to popular sections

### Broken Links
- Automated link checking in CI/CD
- Redirect management for moved content
- Clear error messages with alternatives

### Content Validation
- Frontmatter schema validation
- Required field checking
- Image and asset validation

## Testing Strategy

### Content Testing
- Automated spell checking and grammar validation
- Link validation and broken link detection
- Image optimization and alt text verification
- Frontmatter schema compliance

### User Experience Testing
- Mobile responsiveness testing
- Accessibility compliance (WCAG 2.1 AA)
- Performance testing (Core Web Vitals)
- Cross-browser compatibility

### Search Testing
- Search result relevance validation
- Query performance testing
- Index completeness verification

### Integration Testing
- Build process validation
- Deployment pipeline testing
- CDN and asset delivery testing

## Content Strategy

### Writing Guidelines
- **Tone**: Professional but approachable, crypto-native friendly
- **Structure**: Clear headings, bullet points, code examples
- **Length**: Concise but comprehensive, scannable content
- **Examples**: Real-world use cases with actual code

### Content Templates

#### Feature Documentation Template
```markdown
---
title: [Feature Name]
description: [Brief description]
category: features
difficulty: [beginner|intermediate|advanced]
---

# [Feature Name]

## Overview
Brief explanation of what this feature does and why it's useful.

## How It Works
Technical explanation with diagrams if needed.

## Getting Started
Step-by-step guide to using the feature.

## Examples
Practical examples with code snippets.

## Troubleshooting
Common issues and solutions.

## Related Features
Links to related documentation.
```

#### API Documentation Template
```markdown
---
title: [Endpoint Name]
description: [Brief description]
category: api-reference
---

# [Endpoint Name]

## Endpoint
`[METHOD] /api/v1/[endpoint]`

## Description
What this endpoint does.

## Parameters
Request parameters with types and descriptions.

## Response
Response format and examples.

## Examples
Code examples in multiple languages.

## Error Codes
Possible error responses.
```

### Content Maintenance
- Regular content audits and updates
- Version control for documentation changes
- Open source community contribution guidelines
- GitHub integration for community contributions
- Feedback collection and integration

## SEO and Performance

### SEO Optimization
- Semantic HTML structure with proper headings
- Meta tags and Open Graph data
- Structured data markup
- XML sitemaps and robots.txt
- Internal linking strategy

### Performance Optimization
- Image optimization and lazy loading
- Code splitting and bundle optimization
- CDN integration for static assets
- Caching strategies for dynamic content

### Analytics and Monitoring
- Google Analytics integration
- Search query analysis
- User behavior tracking
- Performance monitoring with Core Web Vitals