// ---------------------------------------------------------------------------
// Default per-tenant role catalogue (ForceLift hierarchy).
//
// Every new tenant is provisioned with these roles pre-wired to a sensible
// starter permission set, which the tenant admin can then freely edit from the
// Roles & Permissions screen. Permission codes here MUST exist in the seeded
// Permission master list (see seed.ts PERMISSIONS) — unknown codes are skipped.
//
// ADMIN is special: it always receives the FULL permission set and is protected
// from deletion / permission edits, so it is intentionally omitted from this
// list and handled separately by the provisioning code.
// ---------------------------------------------------------------------------

export interface DefaultRoleDef {
  code: string;
  name: string;
  description: string;
  permissionCodes: string[];
}

export const DEFAULT_TENANT_ROLES: DefaultRoleDef[] = [
  {
    code: 'SALES_MANAGER',
    name: 'Sales Manager',
    description: 'Owns the sales pipeline and customer relationships',
    // lead.view.all → sees every lead in the tenant (not just their own).
    permissionCodes: [
      'masterdata.view', 'customer.view', 'customer.manage', 'lift.view',
      'lead.view', 'lead.view.all', 'lead.create', 'lead.update', 'lead.assign'
    ]
  },
  {
    code: 'SALES_EXECUTIVE',
    name: 'Sales Executive',
    description: 'Handles leads and customer records',
    // lead.view only (no .all) → scoped to leads assigned to them.
    permissionCodes: [
      'customer.view', 'customer.manage', 'lift.view',
      'lead.view', 'lead.create', 'lead.update'
    ]
  },
  {
    code: 'ACCOUNTS_MANAGER',
    name: 'Accounts Manager',
    description: 'Oversees billing and financial records',
    permissionCodes: ['masterdata.view', 'customer.view', 'amc.view']
  },
  {
    code: 'ACCOUNTANT',
    name: 'Accountant',
    description: 'Records payments and invoices',
    permissionCodes: ['customer.view', 'amc.view']
  },
  {
    code: 'DESIGN_MANAGER',
    name: 'Design Manager',
    description: 'Leads GAD and product design',
    permissionCodes: ['masterdata.view', 'lift.view', 'lift.manage', 'installation.view']
  },
  {
    code: 'DESIGN_ENGINEER',
    name: 'Design Engineer',
    description: 'Prepares lift designs and drawings',
    permissionCodes: ['lift.view', 'installation.view']
  },
  {
    code: 'PRODUCTION_MANAGER',
    name: 'Production Manager',
    description: 'Manages manufacturing orders and factory output',
    permissionCodes: ['masterdata.view', 'lift.view', 'installation.view', 'installation.update', 'installation.assign']
  },
  {
    code: 'STORE_MANAGER',
    name: 'Store Manager',
    description: 'Manages inventory and stores',
    permissionCodes: ['masterdata.view', 'lift.view']
  },
  {
    code: 'PURCHASE_MANAGER',
    name: 'Purchase Manager',
    description: 'Handles vendors and purchase orders',
    permissionCodes: ['masterdata.view', 'customer.view']
  },
  {
    code: 'INSTALLATION_MANAGER',
    name: 'Installation Manager',
    description: 'Plans and oversees installation projects',
    permissionCodes: [
      'masterdata.view',
      'customer.view',
      'lift.view',
      'lift.manage',
      'installation.view',
      'installation.create',
      'installation.update',
      'installation.assign',
      'installation.signoff'
    ]
  },
  {
    code: 'INSTALLATION_ENGINEER',
    name: 'Installation Engineer',
    description: 'Executes on-site installation work',
    permissionCodes: ['lift.view', 'installation.view', 'installation.update', 'installation.signoff']
  },
  {
    code: 'QA_INSPECTOR',
    name: 'QA Inspector',
    description: 'Inspects and signs off quality checkpoints',
    permissionCodes: ['installation.view', 'installation.signoff', 'amc.view']
  },
  {
    code: 'SERVICE_MANAGER',
    name: 'Service Manager',
    description: 'Runs the service and maintenance operation',
    permissionCodes: [
      'masterdata.view',
      'customer.view',
      'lift.view',
      'amc.view',
      'amc.create',
      'amc.update',
      'amc.assign',
      'amc.visit.log'
    ]
  },
  {
    code: 'SERVICE_ENGINEER',
    name: 'Service Engineer',
    description: 'Attends service visits and logs findings',
    permissionCodes: ['lift.view', 'amc.view', 'amc.visit.log']
  },
  {
    code: 'AMC_MANAGER',
    name: 'AMC Manager',
    description: 'Manages AMC contracts and renewals',
    permissionCodes: ['customer.view', 'amc.view', 'amc.create', 'amc.update', 'amc.assign']
  },
  {
    code: 'COMPLAINT_COORDINATOR',
    name: 'Complaint Coordinator',
    description: 'Logs and tracks customer complaints',
    permissionCodes: ['customer.view', 'amc.view']
  },
  {
    code: 'HR_MANAGER',
    name: 'HR Manager',
    description: 'Manages staff accounts and access',
    permissionCodes: ['users.manage']
  }
];
