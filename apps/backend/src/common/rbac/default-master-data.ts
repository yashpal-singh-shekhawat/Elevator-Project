// ---------------------------------------------------------------------------
// Default per-tenant master data (statuses, lift types, service types).
//
// Every newly-provisioned tenant is seeded with these so its Master Data,
// Leads, Installations and AMC screens are immediately usable instead of
// starting with empty dropdowns. The tenant admin can edit/add more later from
// the Master Data screen. This is the single source of truth — seed.ts imports
// the same arrays so the demo tenant matches what real tenants receive.
// ---------------------------------------------------------------------------

export interface DefaultStatusDef {
  entityType: string;
  code: string;
  label: string;
  color?: string;
  sortOrder: number;
}

export const DEFAULT_STATUSES: DefaultStatusDef[] = [
  // LEAD (sales pipeline)
  { entityType: 'LEAD', code: 'NEW', label: 'New', color: 'slate', sortOrder: 1 },
  { entityType: 'LEAD', code: 'CONTACTED', label: 'Contacted', color: 'blue', sortOrder: 2 },
  { entityType: 'LEAD', code: 'QUALIFIED', label: 'Qualified', color: 'indigo', sortOrder: 3 },
  { entityType: 'LEAD', code: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'amber', sortOrder: 4 },
  { entityType: 'LEAD', code: 'NEGOTIATION', label: 'Negotiation', color: 'orange', sortOrder: 5 },
  { entityType: 'LEAD', code: 'WON', label: 'Won', color: 'green', sortOrder: 6 },
  { entityType: 'LEAD', code: 'LOST', label: 'Lost', color: 'red', sortOrder: 7 },

  // QUOTATION (proposal lifecycle — created from a lead)
  { entityType: 'QUOTATION', code: 'DRAFT', label: 'Draft', color: 'slate', sortOrder: 1 },
  { entityType: 'QUOTATION', code: 'SENT', label: 'Sent', color: 'blue', sortOrder: 2 },
  { entityType: 'QUOTATION', code: 'UNDER_REVIEW', label: 'Under Review', color: 'amber', sortOrder: 3 },
  { entityType: 'QUOTATION', code: 'APPROVED', label: 'Approved', color: 'green', sortOrder: 4 },
  { entityType: 'QUOTATION', code: 'REJECTED', label: 'Rejected', color: 'red', sortOrder: 5 },
  { entityType: 'QUOTATION', code: 'REVISED', label: 'Revised', color: 'indigo', sortOrder: 6 },
  { entityType: 'QUOTATION', code: 'EXPIRED', label: 'Expired', color: 'orange', sortOrder: 7 },

  // INSTALLATION_PROJECT
  { entityType: 'INSTALLATION_PROJECT', code: 'DRAFT', label: 'Draft', color: 'slate', sortOrder: 1 },
  { entityType: 'INSTALLATION_PROJECT', code: 'SCHEDULED', label: 'Scheduled', color: 'blue', sortOrder: 2 },
  { entityType: 'INSTALLATION_PROJECT', code: 'IN_PROGRESS', label: 'In Progress', color: 'amber', sortOrder: 3 },
  { entityType: 'INSTALLATION_PROJECT', code: 'ON_HOLD', label: 'On Hold', color: 'orange', sortOrder: 4 },
  { entityType: 'INSTALLATION_PROJECT', code: 'COMPLETED', label: 'Completed', color: 'green', sortOrder: 5 },
  { entityType: 'INSTALLATION_PROJECT', code: 'CANCELLED', label: 'Cancelled', color: 'red', sortOrder: 6 },

  // INSTALLATION_TASK
  { entityType: 'INSTALLATION_TASK', code: 'PENDING', label: 'Pending', color: 'slate', sortOrder: 1 },
  { entityType: 'INSTALLATION_TASK', code: 'IN_PROGRESS', label: 'In Progress', color: 'amber', sortOrder: 2 },
  { entityType: 'INSTALLATION_TASK', code: 'BLOCKED', label: 'Blocked', color: 'red', sortOrder: 3 },
  { entityType: 'INSTALLATION_TASK', code: 'COMPLETED', label: 'Completed', color: 'green', sortOrder: 4 },

  // AMC_CONTRACT
  { entityType: 'AMC_CONTRACT', code: 'DRAFT', label: 'Draft', color: 'slate', sortOrder: 1 },
  { entityType: 'AMC_CONTRACT', code: 'ACTIVE', label: 'Active', color: 'green', sortOrder: 2 },
  { entityType: 'AMC_CONTRACT', code: 'PENDING_RENEWAL', label: 'Pending Renewal', color: 'amber', sortOrder: 3 },
  { entityType: 'AMC_CONTRACT', code: 'EXPIRED', label: 'Expired', color: 'red', sortOrder: 4 },
  { entityType: 'AMC_CONTRACT', code: 'CANCELLED', label: 'Cancelled', color: 'red', sortOrder: 5 },

  // AMC_SCHEDULE
  { entityType: 'AMC_SCHEDULE', code: 'PLANNED', label: 'Planned', color: 'blue', sortOrder: 1 },
  { entityType: 'AMC_SCHEDULE', code: 'COMPLETED', label: 'Completed', color: 'green', sortOrder: 2 },
  { entityType: 'AMC_SCHEDULE', code: 'MISSED', label: 'Missed', color: 'red', sortOrder: 3 },
  { entityType: 'AMC_SCHEDULE', code: 'RESCHEDULED', label: 'Rescheduled', color: 'amber', sortOrder: 4 },

  // AMC_VISIT
  { entityType: 'AMC_VISIT', code: 'SCHEDULED', label: 'Scheduled', color: 'blue', sortOrder: 1 },
  { entityType: 'AMC_VISIT', code: 'IN_PROGRESS', label: 'In Progress', color: 'amber', sortOrder: 2 },
  { entityType: 'AMC_VISIT', code: 'COMPLETED', label: 'Completed', color: 'green', sortOrder: 3 },
  { entityType: 'AMC_VISIT', code: 'CANCELLED', label: 'Cancelled', color: 'red', sortOrder: 4 },

  // LIFT
  { entityType: 'LIFT', code: 'INSTALLED', label: 'Installed', color: 'green', sortOrder: 1 },
  { entityType: 'LIFT', code: 'UNDER_MAINTENANCE', label: 'Under Maintenance', color: 'amber', sortOrder: 2 },
  { entityType: 'LIFT', code: 'DECOMMISSIONED', label: 'Decommissioned', color: 'red', sortOrder: 3 }
];

export const DEFAULT_LIFT_TYPES = [
  { code: 'PASSENGER', name: 'Passenger Lift' },
  { code: 'FREIGHT', name: 'Freight / Goods Lift' },
  { code: 'HOSPITAL', name: 'Hospital Lift' },
  { code: 'PANORAMIC', name: 'Panoramic / Glass Lift' },
  { code: 'HOME', name: 'Home / Residential Lift' }
];

export const DEFAULT_SERVICE_TYPES = [
  { code: 'PREVENTIVE', name: 'Preventive Maintenance' },
  { code: 'BREAKDOWN', name: 'Breakdown / Corrective Maintenance' },
  { code: 'EMERGENCY', name: 'Emergency Callout' },
  { code: 'INSPECTION', name: 'Inspection / Statutory Audit' }
];
