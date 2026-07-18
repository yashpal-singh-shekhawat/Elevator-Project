/**
 * Module 12 — Seed v2 (Fixed for actual Status schema: label + color, no name)
 * Run: cd apps/backend && npx ts-node -r tsconfig-paths/register src/prisma/seed-v2.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = 1;

// ─── PERMISSIONS ─────────────────────────────────────────────────────────────

const NEW_PERMISSIONS: Array<{ code: string; module: string; description: string }> = [
  { code: 'lead.view',                 module: 'lead',         description: 'View leads assigned to you' },
  { code: 'lead.view.all',             module: 'lead',         description: 'View ALL tenant leads (not just your assigned ones)' },
  { code: 'lead.create',               module: 'lead',         description: 'Create leads' },
  { code: 'lead.update',               module: 'lead',         description: 'Update leads' },
  { code: 'lead.assign',               module: 'lead',         description: 'Assign leads' },
  { code: 'lead.manage',               module: 'lead',         description: 'Full lead management' },
  { code: 'quotation.view',            module: 'quotation',    description: 'View quotations' },
  { code: 'quotation.create',          module: 'quotation',    description: 'Create quotations' },
  { code: 'quotation.approve',         module: 'quotation',    description: 'Approve/reject quotations' },
  { code: 'quotation.manage',          module: 'quotation',    description: 'Full quotation management' },
  { code: 'payment.view',              module: 'payment',      description: 'View payments' },
  { code: 'payment.verify',            module: 'payment',      description: 'Verify payments' },
  { code: 'payment.manage',            module: 'payment',      description: 'Full payment management' },
  { code: 'survey.view',               module: 'survey',       description: 'View site surveys' },
  { code: 'survey.create',             module: 'survey',       description: 'Create/update site surveys' },
  { code: 'design.view',               module: 'design',       description: 'View GAD designs' },
  { code: 'design.create',             module: 'design',       description: 'Create GAD designs' },
  { code: 'design.review',             module: 'design',       description: 'Review/approve GAD designs' },
  { code: 'manufacturing.view',        module: 'manufacturing', description: 'View manufacturing orders' },
  { code: 'manufacturing.manage',      module: 'manufacturing', description: 'Manage manufacturing orders' },
  { code: 'manufacturing.qc',          module: 'manufacturing', description: 'QC pass/fail on manufacturing' },
  { code: 'dispatch.view',             module: 'dispatch',     description: 'View dispatches' },
  { code: 'dispatch.manage',           module: 'dispatch',     description: 'Manage dispatches / waybills' },
  { code: 'dispatch.validate',         module: 'dispatch',     description: 'Validate site delivery' },
  { code: 'qa.view',                   module: 'qa',           description: 'View QA audits' },
  { code: 'qa.conduct',                module: 'qa',           description: 'Conduct safety audits / sign-off' },
  { code: 'ticket.view',               module: 'ticket',       description: 'View service tickets' },
  { code: 'ticket.create',             module: 'ticket',       description: 'Create service tickets' },
  { code: 'ticket.update',             module: 'ticket',       description: 'Update service tickets' },
  { code: 'ticket.assign',             module: 'ticket',       description: 'Assign technicians to tickets' },
  { code: 'ticket.close',              module: 'ticket',       description: 'Close service tickets' },
  { code: 'ticket.manage',             module: 'ticket',       description: 'Full ticket management' },
  { code: 'material.view',             module: 'material',     description: 'View material requests' },
  { code: 'material.create',           module: 'material',     description: 'Raise material requests' },
  { code: 'material.approve',          module: 'material',     description: 'Approve material requests' },
  { code: 'inventory.view',            module: 'inventory',    description: 'View inventory' },
  { code: 'inventory.manage',          module: 'inventory',    description: 'Manage inventory stock' },
  { code: 'vendor.view',               module: 'vendor',       description: 'View vendors' },
  { code: 'vendor.manage',             module: 'vendor',       description: 'Manage vendors' },
  { code: 'po.create',                 module: 'po',           description: 'Create purchase orders' },
  { code: 'po.grn',                    module: 'po',           description: 'Receive goods against PO (GRN)' },
  { code: 'invoice.view',              module: 'invoice',      description: 'View invoices' },
  { code: 'invoice.create',            module: 'invoice',      description: 'Create invoices' },
  { code: 'invoice.manage',            module: 'invoice',      description: 'Full invoice management' },
  { code: 'escalation.view',           module: 'escalation',   description: 'View breakdown escalations' },
  { code: 'escalation.review',         module: 'escalation',   description: 'Review and action escalations' },
  { code: 'checklist.template.view',   module: 'checklist',    description: 'View checklist templates' },
  { code: 'checklist.template.manage', module: 'checklist',    description: 'Manage checklist templates' },
  { code: 'workflow.transition',       module: 'workflow',     description: 'Perform workflow status transitions' },
];

// ─── ROLES ───────────────────────────────────────────────────────────────────

const NEW_ROLES = [
  { code: 'SALES',                   name: 'Sales Representative',      description: 'Lead/Survey/Quotation — both verticals' },
  { code: 'ACCOUNTS_FINANCE',        name: 'Accounts & Finance',        description: 'Payments, invoicing — both verticals' },
  { code: 'DESIGN_ENGINEERING',      name: 'Design & Engineering',      description: 'GAD drafting/review — Installation only' },
  { code: 'LOGISTICS_MANUFACTURING', name: 'Logistics & Manufacturing', description: 'Production/dispatch — Installation only' },
  { code: 'INSTALLATION_FIELD',      name: 'Installation Field Team',   description: 'On-site execution — Installation only' },
  { code: 'QA_INSPECTOR',            name: 'QA Inspector',              description: 'Safety audit/handover — Installation only' },
  { code: 'MAINTENANCE_BACKOFFICE',  name: 'Maintenance Back Office',   description: 'Ticket triage/assignment — AMC only' },
  { code: 'MAINTENANCE_FIELD',       name: 'Maintenance Field',         description: 'Field visits/checklists — AMC only' },
  { code: 'PURCHASE_INVENTORY',      name: 'Purchase & Inventory',      description: 'Stock/vendor PO/GRN — AMC only' },
];

// ─── ROLE → PERMISSION MAP ────────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'lead.view','lead.create','lead.update','lead.assign','lead.manage','quotation.manage','payment.manage',
    'survey.view','survey.create','design.view','design.create','design.review',
    'manufacturing.view','manufacturing.manage','manufacturing.qc',
    'dispatch.view','dispatch.manage','dispatch.validate','qa.view','qa.conduct',
    'ticket.manage','material.view','material.create','material.approve',
    'inventory.view','inventory.manage','vendor.view','vendor.manage',
    'po.create','po.grn','invoice.manage','escalation.view','escalation.review',
    'checklist.template.manage','workflow.transition',
  ],
  MANAGER: [
    'lead.view','lead.assign','quotation.view','quotation.approve',
    'payment.view','payment.verify','survey.view','design.view','design.review',
    'manufacturing.view','manufacturing.qc','dispatch.view','dispatch.validate',
    'qa.view','qa.conduct','ticket.manage','material.approve',
    'inventory.view','vendor.view','invoice.view',
    'escalation.view','escalation.review','checklist.template.view','workflow.transition',
  ],
  SALES: [
    'lead.view','lead.create','lead.update','lead.assign',
    'quotation.view','quotation.create','survey.view','survey.create',
    'customer.view','customer.manage','workflow.transition',
  ],
  ACCOUNTS_FINANCE: [
    'payment.view','payment.verify','payment.manage',
    'quotation.view','quotation.approve',
    'invoice.view','invoice.create','invoice.manage','lead.view',
  ],
  DESIGN_ENGINEERING: [
    'design.view','design.create','design.review','survey.view',
    'installation.view','checklist.template.view','workflow.transition',
  ],
  LOGISTICS_MANUFACTURING: [
    'manufacturing.view','manufacturing.manage','manufacturing.qc',
    'dispatch.view','dispatch.manage','inventory.view',
    'installation.view','workflow.transition',
  ],
  INSTALLATION_FIELD: [
    'installation.view','installation.update','dispatch.validate',
    'checklist.template.view','workflow.transition',
  ],
  QA_INSPECTOR: [
    'qa.view','qa.conduct','installation.view',
    'checklist.template.view','checklist.template.manage','workflow.transition',
  ],
  MAINTENANCE_BACKOFFICE: [
    'ticket.view','ticket.create','ticket.assign','ticket.manage',
    'amc.view','amc.update','material.view','material.approve',
    'escalation.view','escalation.review','inventory.view','workflow.transition',
  ],
  MAINTENANCE_FIELD: [
    'ticket.view','ticket.update','ticket.close','amc.view','amc.visit.log',
    'material.view','material.create','checklist.template.view','workflow.transition',
  ],
  PURCHASE_INVENTORY: [
    'inventory.view','inventory.manage','vendor.view','vendor.manage',
    'po.create','po.grn','material.view','material.approve',
  ],
};

// ─── STATUSES (label + color — matches actual schema) ─────────────────────────

const STATUSES: Array<{ entityType: string; code: string; label: string; color: string; sortOrder: number }> = [
  // LEAD
  { entityType: 'LEAD', code: 'LEAD_NEW',             label: 'New Lead',         color: 'slate',  sortOrder: 1 },
  { entityType: 'LEAD', code: 'LEAD_QUALIFYING',       label: 'Qualifying',       color: 'blue',   sortOrder: 2 },
  { entityType: 'LEAD', code: 'LEAD_SURVEY_SCHEDULED', label: 'Survey Scheduled', color: 'amber',  sortOrder: 3 },
  { entityType: 'LEAD', code: 'LEAD_SURVEY_DONE',      label: 'Survey Done',      color: 'amber',  sortOrder: 4 },
  { entityType: 'LEAD', code: 'LEAD_QUOTATION_SENT',   label: 'Quotation Sent',   color: 'blue',   sortOrder: 5 },
  { entityType: 'LEAD', code: 'LEAD_NEGOTIATION',      label: 'In Negotiation',   color: 'orange', sortOrder: 6 },
  { entityType: 'LEAD', code: 'LEAD_WON',              label: 'Won',              color: 'green',  sortOrder: 7 },
  { entityType: 'LEAD', code: 'LEAD_LOST',             label: 'Lost',             color: 'red',    sortOrder: 8 },

  // QUOTATION
  { entityType: 'QUOTATION', code: 'DRAFT',             label: 'Draft',             color: 'slate',  sortOrder: 1 },
  { entityType: 'QUOTATION', code: 'SENT',              label: 'Sent',              color: 'blue',   sortOrder: 2 },
  { entityType: 'QUOTATION', code: 'UNDER_NEGOTIATION', label: 'Under Negotiation', color: 'amber',  sortOrder: 3 },
  { entityType: 'QUOTATION', code: 'APPROVED',          label: 'Approved',          color: 'green',  sortOrder: 4 },
  { entityType: 'QUOTATION', code: 'REJECTED',          label: 'Rejected',          color: 'red',    sortOrder: 5 },
  { entityType: 'QUOTATION', code: 'EXPIRED',           label: 'Expired',           color: 'red',    sortOrder: 6 },

  // INSTALLATION_PROJECT (17-state pipeline)
  { entityType: 'INSTALLATION_PROJECT', code: 'LEAD_CREATED',                         label: 'Lead Created',                      color: 'slate',  sortOrder: 1  },
  { entityType: 'INSTALLATION_PROJECT', code: 'SURVEY_COMPLETED',                     label: 'Survey Completed',                  color: 'blue',   sortOrder: 2  },
  { entityType: 'INSTALLATION_PROJECT', code: 'QUOTATION_SHARED',                     label: 'Quotation Shared',                  color: 'blue',   sortOrder: 3  },
  { entityType: 'INSTALLATION_PROJECT', code: 'COMMERCIAL_APPROVED',                  label: 'Commercial Approved',               color: 'green',  sortOrder: 4  },
  { entityType: 'INSTALLATION_PROJECT', code: 'BOOKING_CONFIRMED',                    label: 'Booking Confirmed',                 color: 'green',  sortOrder: 5  },
  { entityType: 'INSTALLATION_PROJECT', code: 'DESIGN_IN_PROGRESS',                   label: 'Design In Progress',                color: 'amber',  sortOrder: 6  },
  { entityType: 'INSTALLATION_PROJECT', code: 'DESIGN_APPROVED',                      label: 'Design Approved',                   color: 'green',  sortOrder: 7  },
  { entityType: 'INSTALLATION_PROJECT', code: 'IN_PRODUCTION',                        label: 'In Production',                     color: 'amber',  sortOrder: 8  },
  { entityType: 'INSTALLATION_PROJECT', code: 'READY_FOR_DISPATCH',                   label: 'Ready for Dispatch',                color: 'blue',   sortOrder: 9  },
  { entityType: 'INSTALLATION_PROJECT', code: 'IN_TRANSIT',                           label: 'In Transit',                        color: 'blue',   sortOrder: 10 },
  { entityType: 'INSTALLATION_PROJECT', code: 'MATERIAL_RECEIVED_SITE',               label: 'Material Received at Site',         color: 'amber',  sortOrder: 11 },
  { entityType: 'INSTALLATION_PROJECT', code: 'INSTALLATION_PHASE_1_COMPLETE',        label: 'Phase 1 Complete (Scaffolding)',    color: 'amber',  sortOrder: 12 },
  { entityType: 'INSTALLATION_PROJECT', code: 'INSTALLATION_PHASE_2_COMPLETE',        label: 'Phase 2 Complete (Mechanical)',     color: 'amber',  sortOrder: 13 },
  { entityType: 'INSTALLATION_PROJECT', code: 'INSTALLATION_FULLY_EXECUTED',          label: 'Fully Executed (Electrical Done)',  color: 'amber',  sortOrder: 14 },
  { entityType: 'INSTALLATION_PROJECT', code: 'AUDIT_COMPLETED',                      label: 'Safety Audit Completed',            color: 'blue',   sortOrder: 15 },
  { entityType: 'INSTALLATION_PROJECT', code: 'TESTING_AND_COMMISSIONING_SUCCESSFUL', label: 'Testing & Commissioning Successful',color: 'blue',   sortOrder: 16 },
  { entityType: 'INSTALLATION_PROJECT', code: 'PROJECT_COMPLETED_AND_HANDED_OVER',    label: 'Completed & Handed Over',           color: 'green',  sortOrder: 17 },
  { entityType: 'INSTALLATION_PROJECT', code: 'CANCELLED',                            label: 'Cancelled',                         color: 'red',    sortOrder: 18 },

  // GAD_DESIGN
  { entityType: 'GAD_DESIGN', code: 'DRAFT',              label: 'Draft',              color: 'slate',  sortOrder: 1 },
  { entityType: 'GAD_DESIGN', code: 'REVIEW_PENDING',     label: 'Review Pending',     color: 'amber',  sortOrder: 2 },
  { entityType: 'GAD_DESIGN', code: 'APPROVED',           label: 'Approved',           color: 'green',  sortOrder: 3 },
  { entityType: 'GAD_DESIGN', code: 'REVISION_REQUESTED', label: 'Revision Requested', color: 'red',    sortOrder: 4 },

  // MANUFACTURING_ORDER
  { entityType: 'MANUFACTURING_ORDER', code: 'RELEASED',           label: 'Released to Production', color: 'blue',   sortOrder: 1 },
  { entityType: 'MANUFACTURING_ORDER', code: 'IN_PRODUCTION',      label: 'In Production',          color: 'amber',  sortOrder: 2 },
  { entityType: 'MANUFACTURING_ORDER', code: 'QC_PENDING',         label: 'QC Pending',             color: 'amber',  sortOrder: 3 },
  { entityType: 'MANUFACTURING_ORDER', code: 'QC_PASSED',          label: 'QC Passed',              color: 'green',  sortOrder: 4 },
  { entityType: 'MANUFACTURING_ORDER', code: 'READY_FOR_DISPATCH', label: 'Ready for Dispatch',     color: 'blue',   sortOrder: 5 },

  // DISPATCH
  { entityType: 'DISPATCH', code: 'PENDING',    label: 'Pending Dispatch',   color: 'slate',  sortOrder: 1 },
  { entityType: 'DISPATCH', code: 'DISPATCHED', label: 'Dispatched',         color: 'blue',   sortOrder: 2 },
  { entityType: 'DISPATCH', code: 'IN_TRANSIT', label: 'In Transit',         color: 'amber',  sortOrder: 3 },
  { entityType: 'DISPATCH', code: 'DELIVERED',  label: 'Delivered',          color: 'green',  sortOrder: 4 },
  { entityType: 'DISPATCH', code: 'EXCEPTION',  label: 'Exception / Damage', color: 'red',    sortOrder: 5 },

  // AMC_CONTRACT
  { entityType: 'AMC_CONTRACT', code: 'LEAD_RAISED',        label: 'Lead Raised',        color: 'slate',  sortOrder: 1 },
  { entityType: 'AMC_CONTRACT', code: 'ASSESSMENT_PENDING', label: 'Assessment Pending', color: 'amber',  sortOrder: 2 },
  { entityType: 'AMC_CONTRACT', code: 'PROPOSAL_SENT',      label: 'Proposal Sent',      color: 'blue',   sortOrder: 3 },
  { entityType: 'AMC_CONTRACT', code: 'CLIENT_ACCEPTED',    label: 'Client Accepted',    color: 'green',  sortOrder: 4 },
  { entityType: 'AMC_CONTRACT', code: 'ACTIVE',             label: 'Active',             color: 'green',  sortOrder: 5 },
  { entityType: 'AMC_CONTRACT', code: 'RENEWAL_DUE',        label: 'Renewal Due',        color: 'orange', sortOrder: 6 },
  { entityType: 'AMC_CONTRACT', code: 'EXPIRED',            label: 'Expired',            color: 'red',    sortOrder: 7 },
  { entityType: 'AMC_CONTRACT', code: 'TERMINATED',         label: 'Terminated',         color: 'red',    sortOrder: 8 },

  // SERVICE_TICKET
  { entityType: 'SERVICE_TICKET', code: 'TICKET_OPENED',       label: 'Ticket Opened',       color: 'slate',  sortOrder: 1 },
  { entityType: 'SERVICE_TICKET', code: 'TRIAGED',             label: 'Triaged',             color: 'blue',   sortOrder: 2 },
  { entityType: 'SERVICE_TICKET', code: 'TECHNICIAN_ASSIGNED', label: 'Technician Assigned', color: 'blue',   sortOrder: 3 },
  { entityType: 'SERVICE_TICKET', code: 'IN_PROGRESS',         label: 'In Progress',         color: 'amber',  sortOrder: 4 },
  { entityType: 'SERVICE_TICKET', code: 'PENDING_PARTS',       label: 'Pending Parts',       color: 'orange', sortOrder: 5 },
  { entityType: 'SERVICE_TICKET', code: 'RESOLVED',            label: 'Resolved',            color: 'green',  sortOrder: 6 },
  { entityType: 'SERVICE_TICKET', code: 'CLOSED',              label: 'Closed',              color: 'green',  sortOrder: 7 },
  { entityType: 'SERVICE_TICKET', code: 'ESCALATED',           label: 'Escalated',           color: 'red',    sortOrder: 8 },

  // MATERIAL_REQUEST
  { entityType: 'MATERIAL_REQUEST', code: 'DRAFT',           label: 'Draft',             color: 'slate',  sortOrder: 1 },
  { entityType: 'MATERIAL_REQUEST', code: 'SUBMITTED',       label: 'Submitted',         color: 'blue',   sortOrder: 2 },
  { entityType: 'MATERIAL_REQUEST', code: 'APPROVED',        label: 'Approved',          color: 'green',  sortOrder: 3 },
  { entityType: 'MATERIAL_REQUEST', code: 'IN_STOCK_ISSUED', label: 'Issued from Stock', color: 'green',  sortOrder: 4 },
  { entityType: 'MATERIAL_REQUEST', code: 'PO_RAISED',       label: 'PO Raised',         color: 'amber',  sortOrder: 5 },
  { entityType: 'MATERIAL_REQUEST', code: 'GRN_RECEIVED',    label: 'GRN Received',      color: 'amber',  sortOrder: 6 },
  { entityType: 'MATERIAL_REQUEST', code: 'FULFILLED',       label: 'Fulfilled',         color: 'green',  sortOrder: 7 },
  { entityType: 'MATERIAL_REQUEST', code: 'REJECTED',        label: 'Rejected',          color: 'red',    sortOrder: 8 },

  // VENDOR_PO
  { entityType: 'VENDOR_PO', code: 'DRAFT',          label: 'Draft',           color: 'slate',  sortOrder: 1 },
  { entityType: 'VENDOR_PO', code: 'SENT',           label: 'Sent to Vendor',  color: 'blue',   sortOrder: 2 },
  { entityType: 'VENDOR_PO', code: 'ACKNOWLEDGED',   label: 'Acknowledged',    color: 'amber',  sortOrder: 3 },
  { entityType: 'VENDOR_PO', code: 'GOODS_RECEIVED', label: 'Goods Received',  color: 'green',  sortOrder: 4 },
  { entityType: 'VENDOR_PO', code: 'CLOSED',         label: 'Closed',          color: 'green',  sortOrder: 5 },
  { entityType: 'VENDOR_PO', code: 'CANCELLED',      label: 'Cancelled',       color: 'red',    sortOrder: 6 },

  // INVOICE
  { entityType: 'INVOICE', code: 'DRAFT',          label: 'Draft',          color: 'slate',  sortOrder: 1 },
  { entityType: 'INVOICE', code: 'SENT',           label: 'Sent',           color: 'blue',   sortOrder: 2 },
  { entityType: 'INVOICE', code: 'PARTIALLY_PAID', label: 'Partially Paid', color: 'amber',  sortOrder: 3 },
  { entityType: 'INVOICE', code: 'PAID',           label: 'Paid',           color: 'green',  sortOrder: 4 },
  { entityType: 'INVOICE', code: 'OVERDUE',        label: 'Overdue',        color: 'red',    sortOrder: 5 },
  { entityType: 'INVOICE', code: 'CANCELLED',      label: 'Cancelled',      color: 'red',    sortOrder: 6 },

  // BREAKDOWN_ESCALATION
  { entityType: 'BREAKDOWN_ESCALATION', code: 'OPEN',                    label: 'Open',                    color: 'slate',  sortOrder: 1 },
  { entityType: 'BREAKDOWN_ESCALATION', code: 'UNDER_REVIEW',            label: 'Under Review',            color: 'amber',  sortOrder: 2 },
  { entityType: 'BREAKDOWN_ESCALATION', code: 'ROUTED_TO_MODERNIZATION', label: 'Routed to Modernization', color: 'orange', sortOrder: 3 },
  { entityType: 'BREAKDOWN_ESCALATION', code: 'RESOLVED_IN_AMC',         label: 'Resolved within AMC',     color: 'green',  sortOrder: 4 },
  { entityType: 'BREAKDOWN_ESCALATION', code: 'CLOSED',                  label: 'Closed',                  color: 'green',  sortOrder: 5 },
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Module 12 seed-v2 starting...\n');

  // 1. Permissions
  console.log('📋 Upserting permissions...');
  for (const perm of NEW_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      create: { code: perm.code, module: perm.module, description: perm.description },
      update: { module: perm.module, description: perm.description },
    });
  }
  console.log(`   ✅ ${NEW_PERMISSIONS.length} permissions done`);

  // 2. Roles
  console.log('\n👥 Upserting roles...');
  for (const role of NEW_ROLES) {
    await prisma.role.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: role.code } },
      create: { tenantId: TENANT_ID, code: role.code, name: role.name, description: role.description },
      update: { name: role.name, description: role.description },
    });
  }
  console.log(`   ✅ ${NEW_ROLES.length} roles done`);

  // 3. Role-Permission assignments
  console.log('\n🔑 Assigning permissions to roles...');
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findFirst({ where: { tenantId: TENANT_ID, code: roleCode } });
    if (!role) { console.log(`   ⚠️  Role ${roleCode} not found, skipping`); continue; }
    for (const permCode of permCodes) {
      const perm = await prisma.permission.findFirst({ where: { code: permCode } });
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        create: { roleId: role.id, permissionId: perm.id },
        update: {},
      });
    }
  }
  console.log(`   ✅ Role-permission assignments done`);

  // 4. Statuses
  console.log('\n📊 Upserting statuses...');
  let count = 0;
  for (const s of STATUSES) {
    await prisma.status.upsert({
      where: { tenantId_entityType_code: { tenantId: TENANT_ID, entityType: s.entityType, code: s.code } },
      create: { tenantId: TENANT_ID, entityType: s.entityType, code: s.code, label: s.label, color: s.color, sortOrder: s.sortOrder, isActive: true },
      update: { label: s.label, color: s.color, sortOrder: s.sortOrder },
    });
    count++;
  }
  console.log(`   ✅ ${count} statuses done`);

  console.log('\n✅ Module 12 seed-v2 complete!');
  console.log(`   Permissions : ${NEW_PERMISSIONS.length}`);
  console.log(`   New roles   : ${NEW_ROLES.length}`);
  console.log(`   Statuses    : ${count}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
