import { ensureTenant, createProject, createTender } from "./store";
import { DEFAULT_TENANT, ARA_TENANT_CONFIG } from "./tenant";
import type { Tenant, Project, Tender } from "./schema";

// ARA capability library for property services
export const ARA_CAPABILITIES = [
  {
    category: "Cleaning Services",
    capabilities: [
      "Daily office cleaning",
      "Deep cleaning",
      "Carpet cleaning",
      "Window cleaning",
      "Washroom maintenance",
      "Floor care and maintenance",
    ]
  },
  {
    category: "Waste Management", 
    capabilities: [
      "General waste collection",
      "Recycling programs",
      "Confidential waste destruction",
      "Medical waste disposal",
      "Hazardous waste management",
    ]
  },
  {
    category: "Grounds Maintenance",
    capabilities: [
      "Landscaping and gardening",
      "Lawn maintenance",
      "Tree and shrub care",
      "Irrigation systems",
      "Snow and ice management",
      "Pest control",
    ]
  },
  {
    category: "Facilities Management",
    capabilities: [
      "Help desk services",
      "Preventive maintenance",
      "Emergency response",
      "Space planning",
      "Move management",
      "Asset management",
    ]
  },
  {
    category: "QHSE & Compliance",
    capabilities: [
      "Health & safety management",
      "Risk assessments",
      "Incident management",
      "Environmental compliance",
      "Quality assurance",
      "Audit management",
    ]
  },
  {
    category: "Staffing & Training",
    capabilities: [
      "Staff recruitment",
      "Training programs",
      "Performance management",
      "Uniform provision",
      "Background screening",
      "Succession planning",
    ]
  }
];

// ARA rate cards for common services
export const ARA_RATE_CARDS = [
  {
    category: "Labor - Cleaning",
    rates: [
      { role: "Cleaner", rate: 15.50, unit: "hour", description: "Standard office cleaning" },
      { role: "Team Leader", rate: 18.00, unit: "hour", description: "Cleaning supervision" },
      { role: "Deep Clean Specialist", rate: 22.00, unit: "hour", description: "Specialized deep cleaning" },
    ]
  },
  {
    category: "Labor - Grounds", 
    rates: [
      { role: "Groundskeeper", rate: 17.00, unit: "hour", description: "General grounds maintenance" },
      { role: "Arborist", rate: 35.00, unit: "hour", description: "Tree care specialist" },
      { role: "Irrigation Technician", rate: 28.00, unit: "hour", description: "Irrigation maintenance" },
    ]
  },
  {
    category: "Labor - Facilities",
    rates: [
      { role: "FM Coordinator", rate: 25.00, unit: "hour", description: "Facilities coordination" },
      { role: "Maintenance Technician", rate: 32.00, unit: "hour", description: "General maintenance" },
      { role: "Help Desk Agent", rate: 20.00, unit: "hour", description: "Customer service" },
    ]
  },
  {
    category: "Equipment & Materials",
    rates: [
      { item: "Cleaning Equipment", rate: 2.50, unit: "sqm/month", description: "Pro-rata equipment costs" },
      { item: "Cleaning Chemicals", rate: 1.75, unit: "sqm/month", description: "Eco-friendly cleaning supplies" },
      { item: "Uniforms", rate: 85.00, unit: "per person/year", description: "Staff uniform allowance" },
    ]
  }
];

// Document templates for proposal sections
export const ARA_DOCUMENT_TEMPLATES = [
  {
    section: "Executive Summary",
    outline: [
      "Company overview and credentials",
      "Understanding of requirements",
      "Service delivery approach",
      "Value proposition",
      "Key differentiators"
    ]
  },
  {
    section: "Technical Approach",
    outline: [
      "Service delivery methodology",
      "Quality assurance framework",
      "Performance monitoring",
      "Continuous improvement",
      "Technology integration"
    ]
  },
  {
    section: "Staffing Plan",
    outline: [
      "Organizational structure",
      "Key personnel profiles",
      "Staffing levels and schedules",
      "Training and development",
      "Performance management"
    ]
  },
  {
    section: "QHSE Management",
    outline: [
      "Health and safety policy",
      "Risk management framework",
      "Environmental compliance",
      "Quality management system",
      "Emergency procedures"
    ]
  },
  {
    section: "Mobilization Plan",
    outline: [
      "Transition timeline",
      "Resource mobilization",
      "Staff onboarding",
      "Systems integration",
      "Go-live readiness"
    ]
  }
];

let _seedData: {
  tenant: Tenant;
  projectId: string;
  tenderId: string;
} | null = null;

/**
 * Seeds ARA Property Services data if not already seeded
 * Returns the seeded tenant, project, and tender IDs
 */
export async function seedARA(): Promise<{ tenant: Tenant; projectId: string; tenderId: string }> {
  if (_seedData) {
    return _seedData;
  }

  try {
    // Ensure ARA tenant exists
    const tenant = await ensureTenant(DEFAULT_TENANT);
    
    // Create default project if needed  
    let project: Project;
    try {
      project = await createProject(
        tenant.id,
        "ARA Bid Workspace",
        "Comprehensive bid and tender management for facility management contracts across Australia"
      );
    } catch (error) {
      // Project might already exist, that's okay
      console.warn("Project creation skipped (may already exist):", error);
      project = { 
        id: "default-project", 
        tenantId: tenant.id, 
        name: "ARA Bid Workspace",
        description: "Default workspace for managing bids and tenders"
      };
    }

    // Create default tender if needed
    let tender: Tender;
    try {
      tender = await createTender(
        tenant.id,
        project.id,
        "Commercial Facilities Management Contract - Multi-Site"
      );
    } catch (error) {
      // Tender might already exist, that's okay
      console.warn("Tender creation skipped (may already exist):", error);
      tender = {
        id: "default-tender",
        tenantId: tenant.id,
        projectId: project.id,
        name: "Sample Facilities Management RFP",
        status: "draft"
      };
    }

    _seedData = {
      tenant,
      projectId: project.id,
      tenderId: tender.id,
    };

    console.log(`✅ ARA tenant "${tenant.name}" seeded successfully`);
    return _seedData;
  } catch (error) {
    console.error("Failed to seed ARA data:", error);
    throw error;
  }
}

/**
 * Gets capabilities for a specific category
 */
export function getCapabilitiesByCategory(category: string) {
  return ARA_CAPABILITIES.find(cap => cap.category === category)?.capabilities || [];
}

/**
 * Gets all capabilities as a flat array
 */
export function getAllCapabilities() {
  return ARA_CAPABILITIES.flatMap(cat => cat.capabilities);
}

/**
 * Gets rate card for a specific category
 */
export function getRatesByCategory(category: string) {
  return ARA_RATE_CARDS.find(card => card.category === category)?.rates || [];
}

/**
 * Gets template outline for a specific section
 */
export function getTemplateOutline(section: string) {
  return ARA_DOCUMENT_TEMPLATES.find(template => template.section === section)?.outline || [];
}

/**
 * Reset seed data (for testing)
 */
export function resetSeedData() {
  _seedData = null;
}

