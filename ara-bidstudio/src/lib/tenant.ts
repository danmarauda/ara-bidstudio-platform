export type TenantContext = {
  tenant: string;
};

export function parseTenant(param?: string): string {
  return (param || "").toLowerCase();
}

export const DEFAULT_TENANT = process.env.DEFAULT_TENANT || "ara-property-services";

/**
 * Normalizes a tenant slug to lowercase and replaces spaces/underscores with hyphens
 * @param slug - The raw tenant slug
 * @returns Normalized tenant slug
 */
export function normalizeTenantSlug(slug: string): string {
  return slug.toLowerCase().replace(/[\s_]+/g, '-');
}

/**
 * Gets the display name for a tenant slug
 * @param slug - The tenant slug (e.g., "ara-property-services")
 * @returns Human-readable name (e.g., "ARA Property Services")
 */
export function getTenantDisplayName(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * ARA Property Services specific configuration based on actual brand research
 */
export const ARA_TENANT_CONFIG = {
  slug: "ara-property-services",
  name: "ARA Property Services",
  description: "Market leader in Australia's facility management industry. Specialists in commercial cleaning, healthcare cleaning, maintenance services, and integrated property maintenance across Australia.",
  tagline: "Here for you. Here for good.",
  logo: "/ara-logo.svg",
  // Official ARA brand colors from logo and website
  primaryColor: "#AFCC37", // ARA lime green (official brand color from logo)
  secondaryColor: "#435464", // ARA dark blue-gray (from logo text)
  accentColor: "#9BBB28", // Darker lime green for interactions/hover states
  lightColor: "#C6DB5C", // Lighter lime green variation
  darkColor: "#323E4A", // Darker blue-gray variation
  successColor: "#10B981", // Success green
  warningColor: "#F59E0B", // Warning amber
  errorColor: "#EF4444", // Error red
  // Company details from research
  founded: 1994,
  headquarters: "Camberwell, Victoria",
  employeeCount: "500-1000",
  serviceAreas: [
    "Commercial Cleaning",
    "Healthcare Cleaning", 
    "Maintenance Services",
    "Property Management",
    "Facilities Reporting",
    "Emergency Response"
  ],
  coverage: "Australia-wide with offices in every state",
  certifications: [
    "ISO 9001 (Quality)",
    "ISO 4801 (Occupational Health and Safety)", 
    "ISO 14001 (Environmental Management)"
  ],
  phone: "1300 889 210",
  website: "https://propertyservices.aragroup.com.au",
};

