// Shared shapes consumed by both apps/backend and apps/frontend, so both
// sides agree on the API envelope and core domain fields without either
// re-declaring them. Populated incrementally as each module ships.

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: { pagination?: PaginationMeta } & Record<string, unknown>;
  error: null;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// --- Auth / Users ---

export interface SafeUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  roleCode: string;
  roleName: string;
  permissions: string[];
  // Multi-tenant: the company unique code (tenant slug) this user belongs to.
  // Used by the frontend to build tenant-scoped URLs and the x-tenant-code header.
  companyCode: string;
}

export interface LoginResponse {
  accessToken: string;
  user: SafeUser;
}

// --- Platform (super-admin) ---

export interface PlatformUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface PlatformLoginResponse {
  accessToken: string;
  user: PlatformUserDto;
}

export interface TenantDto {
  id: number;
  companyName: string;
  companyUniqueCode: string;
  status: 'ACTIVE' | 'INACTIVE';
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  organizationCount?: number;
  createdAt?: string;
  // Present ONLY in the createTenant response: the new tenant admin's first-login
  // details. Shown once to the super admin; the temp password is never re-fetched.
  adminCredentials?: {
    loginUrl: string;
    email: string;
    tempPassword: string;
  };
}

export interface CreateTenantInput {
  companyName: string;
  companyUniqueCode: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  // Base64 data URL (data:image/png;base64,...). Backend decodes + stores it.
  logoBase64?: string;
}

export interface UpdateTenantInput {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  logoBase64?: string;
}

// --- Tenant user management (RBAC) ---

// A tenant user as returned by GET /users. passwordHash never crosses the wire.
export interface TenantUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  roleId: number;
  role?: {
    id: number;
    code: string;
    name: string;
  };
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface CreateTenantUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: number;
}

export interface UpdateTenantUserInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: number;
  isActive?: boolean;
}

// A tenant role plus the permission codes granted to it (checkbox-matrix state).
export interface RoleDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  // ADMIN role: cannot be deleted and its permissions are locked to "all".
  isSystem: boolean;
  userCount: number;
  permissionCodes: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleInput {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface SetRolePermissionsInput {
  permissionCodes: string[];
}

// One permission in the master list.
export interface PermissionDto {
  code: string;
  description: string | null;
}

// Permissions grouped by module — the shape GET /roles/permissions returns and
// what the checkbox matrix renders section-by-section.
export interface PermissionGroupDto {
  module: string;
  permissions: PermissionDto[];
}

// Super-admin platform dashboard aggregates.
export interface PlatformDashboardStats {
  totals: {
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    totalUsers: number;
    activeUsers: number;
  };
  recentTenants: TenantDto[];
  recentUsers: Array<{
    id: number;
    fullName: string;
    email: string;
    roleName: string | null;
    tenantName: string | null;
    createdAt?: string;
  }>;
  usersByTenant: Array<{ tenantName: string; count: number }>;
}

// --- Master data ---

export interface StatusDto {
  id: number;
  entityType: string;
  code: string;
  label: string;
  color?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface LiftTypeDto {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface ServiceTypeDto {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

// --- CRM / Assets ---

export interface CustomerDto {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
  billingAddress?: string | null;
}

export interface SiteDto {
  id: number;
  customerId: number;
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
}

export interface LiftDto {
  id: number;
  siteId: number;
  liftTypeId: number;
  statusId: number;
  serialNumber: string;
  model?: string | null;
  capacityKg?: number | null;
  numberOfFloors?: number | null;
}

// --- Installation workflow ---

export interface StatusRef {
  id: number;
  code: string;
  label: string;
  color?: string | null;
}

export interface InstallationProjectDto {
  id: number;
  projectCode: string;
  customerId: number;
  siteId: number;
  assignedEngineerId?: number | null;
  liftId?: number | null;
  plannedStartDate?: string | null;
  plannedEndDate?: string | null;
  actualStartDate?: string | null;
  actualEndDate?: string | null;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; name: string };
  site: { id: number; name: string; city?: string | null };
  liftType: { id: number; code: string; name: string };
  status: StatusRef;
  lift: { id: number; serialNumber: string } | null;
}

export interface InstallationTaskDto {
  id: number;
  installationProjectId: number;
  title: string;
  description?: string | null;
  sequence: number;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  status: StatusRef;
  assignedTo: { id: number; firstName: string; lastName: string; email: string } | null;
}

export interface InstallationMilestoneDto {
  id: number;
  installationProjectId: number;
  name: string;
  remarks?: string | null;
  signOffById?: number | null;
  signOffAt?: string | null;
  createdAt: string;
  status: StatusRef;
}

export interface ChecklistItemDto {
  id: number;
  entityType: string;
  entityId: number;
  label: string;
  isChecked: boolean;
  checkedById?: number | null;
  checkedAt?: string | null;
  remarks?: string | null;
  sortOrder: number;
}

// --- AMC workflow ---

export interface AmcContractDto {
  id: number;
  contractNumber: string;
  customerId: number;
  liftId: number;
  startDate: string;
  endDate: string;
  contractValue?: number | null;
  numberOfServicesPerYear: number;
  tier?: 'BASIC' | 'STANDARD' | 'PREMIUM' | null;
  autoRenew: boolean;
  createdAt: string;
  customer: { id: number; name: string };
  lift: { id: number; serialNumber: string };
  status: StatusRef;
  serviceType: { id: number; code: string; name: string };
}

export interface AmcScheduleDto {
  id: number;
  amcContractId: number;
  scheduledDate: string;
  createdAt: string;
  status: StatusRef;
  serviceType: { id: number; code: string; name: string };
}

export interface AmcVisitDto {
  id: number;
  amcContractId: number;
  amcScheduleId?: number | null;
  liftId: number;
  visitDate: string;
  findings?: string | null;
  actionsTaken?: string | null;
  nextServiceDate?: string | null;
  createdAt: string;
  status: StatusRef;
  serviceType: { id: number; code: string; name: string };
  technician: { id: number; firstName: string; lastName: string; email: string } | null;
  lift: { id: number; serialNumber: string };
}

// --- v2: Shared (Lead/Quotation/WorkflowTransition/ChecklistTemplate) ---

export type LeadVertical = 'INSTALLATION' | 'AMC';
export type LeadSource = 'REFERRAL' | 'DIRECT' | 'CHANNEL_PARTNER' | 'WARRANTY_EXPIRY' | 'RENEWAL_DUE';

export interface LeadDto {
  id: number;
  leadCode: string;
  vertical: LeadVertical;
  customerId?: number | null;
  siteId?: number | null;
  statusId: number;
  assignedToId?: number | null;
  source?: LeadSource | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  notes?: string | null;
  modernizationFlag: boolean;
  createdAt: string;
  updatedAt: string;
  customer: { id: number; name: string } | null;
  site: { id: number; name: string } | null;
  status: StatusRef;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
}

export type QuotationTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface QuotationDto {
  id: number;
  quotationCode: string;
  leadId: number;
  version: number;
  tier?: QuotationTier | null;
  statusId: number;
  preparedById?: number | null;
  approvedById?: number | null;
  approvedAt?: string | null;
  validUntil?: string | null;
  totalAmount?: number | null;
  notes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  status: StatusRef;
}

export interface WorkflowTransitionDto {
  id: number;
  entityType: string;
  entityId: number;
  fromStatusId?: number | null;
  toStatusId: number;
  actionedById: number;
  remarks?: string | null;
  createdAt: string;
  fromStatus: StatusRef | null;
  toStatus: StatusRef;
  actionedBy: { id: number; firstName: string; lastName: string };
}

export interface ChecklistTemplateItemDto {
  id: number;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ChecklistTemplateDto {
  id: number;
  name: string;
  description?: string | null;
  entityType: string;
  isActive: boolean;
  items: ChecklistTemplateItemDto[];
}

// --- v2: Installation-specific ---

export type PowerAvailability = 'SINGLE_PHASE' | 'THREE_PHASE' | 'NOT_AVAILABLE';

export interface SiteSurveyDto {
  id: number;
  installationProjectId: number;
  surveyedById?: number | null;
  surveyedAt?: string | null;
  pitDepthMm?: number | null;
  shaftWidthMm?: number | null;
  shaftDepthMm?: number | null;
  overheadClearanceMm?: number | null;
  powerAvailability?: PowerAvailability | null;
  powerVoltage?: number | null;
  machineRoomAvailable?: boolean | null;
  floorCount?: number | null;
  buildingType?: string | null;
  accessibilityNotes?: string | null;
  observations?: string | null;
  createdAt: string;
}

export interface GadDesignDto {
  id: number;
  installationProjectId: number;
  version: number;
  statusId: number;
  preparedById?: number | null;
  reviewedById?: number | null;
  reviewedAt?: string | null;
  revisionNotes?: string | null;
  notes?: string | null;
  approvedAt?: string | null;
  fileUrl?: string | null;
  createdAt: string;
  status: StatusRef;
}

export interface ManufacturingOrderDto {
  id: number;
  orderCode: string;
  installationProjectId: number;
  statusId: number;
  releasedById?: number | null;
  releasedAt?: string | null;
  qcPassedAt?: string | null;
  qcPassedById?: number | null;
  notes?: string | null;
  createdAt: string;
  status: StatusRef;
}

export interface DispatchDto {
  id: number;
  dispatchCode: string;
  manufacturingOrderId: number;
  installationProjectId: number;
  statusId: number;
  waybillNumber?: string | null;
  carrierName?: string | null;
  dispatchedAt?: string | null;
  estimatedDeliveryDate?: string | null;
  deliveredAt?: string | null;
  exceptionNotes?: string | null;
  notes?: string | null;
  createdAt: string;
  status: StatusRef;
}

// --- v2: AMC-specific ---

export interface ServiceTicketDto {
  id: number;
  ticketCode: string;
  amcContractId: number;
  liftId: number;
  statusId: number;
  source: string;
  categoryTag?: string | null;
  priorityFlag: string;
  passengerEntrapped: boolean;
  assignedToId?: number | null;
  assignedAt?: string | null;
  amcScheduleId?: number | null;
  findings?: string | null;
  recommendations?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  closedById?: number | null;
  nextServiceDate?: string | null;
  createdAt: string;
  status: StatusRef;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  amcContract: { id: number; contractNumber: string };
  lift: { id: number; serialNumber: string };
  amcSchedule: { id: number; scheduledDate: string } | null;
}

// --- v2: AMC Module 17 DTOs ---

export interface MaterialRequestItemDto {
  id: number;
  materialRequestId: number;
  partNumber: string;
  partName: string;
  quantityRequested: number;
  quantityIssued: number;
  inventoryStockId?: number | null;
  vendorPoId?: number | null;
  createdAt: string;
}

export interface MaterialRequestDto {
  id: number;
  mrdCode: string;
  serviceTicketId: number;
  statusId: number;
  raisedById: number;
  coverageEligible: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  status: StatusRef;
  raisedBy: { id: number; firstName: string; lastName: string };
  lineItems: MaterialRequestItemDto[];
}

export interface CreateMaterialRequestInput {
  serviceTicketId: number;
  coverageEligible?: boolean;
  notes?: string;
  lineItems: Array<{ partNumber: string; partName: string; quantityRequested: number }>;
}

export interface InventoryStockDto {
  id: number;
  partNumber: string;
  partName: string;
  description?: string | null;
  quantityOnHand: number;
  reorderLevel: number;
  location?: string | null;
  bisIsiCertified: boolean;
  unitCost?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryStockInput {
  partNumber: string;
  partName: string;
  description?: string;
  quantityOnHand?: number;
  reorderLevel?: number;
  location?: string;
  bisIsiCertified?: boolean;
  unitCost?: number;
}

export interface AdjustStockInput {
  quantity: number;
  reason: string;
}

export interface VendorDto {
  id: number;
  vendorCode: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  bisIsiApproved: boolean;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorInput {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  bisIsiApproved?: boolean;
  notes?: string;
}

export interface VendorPurchaseOrderDto {
  id: number;
  poCode: string;
  vendorId: number;
  statusId: number;
  raisedById: number;
  expectedDelivery?: string | null;
  grnReceivedAt?: string | null;
  grnReceivedById?: number | null;
  bisIsiCertFlag: boolean;
  totalAmount?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: { id: number; name: string };
  status: StatusRef;
  raisedBy: { id: number; firstName: string; lastName: string };
}

export interface CreateVendorPOInput {
  vendorId: number;
  expectedDelivery?: string;
  bisIsiCertFlag?: boolean;
  totalAmount?: number;
  notes?: string;
  lineItems?: Array<{ partNumber: string; partName: string; quantityRequested: number }>;
}

export interface GrnInput {
  receivedItems: Array<{ partNumber: string; partName: string; quantityReceived: number }>;
}

export interface InvoiceLineItemDto {
  id: number;
  invoiceId: number;
  description: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  createdAt: string;
}

export interface InvoiceDto {
  id: number;
  invoiceCode: string;
  entityType: string;
  entityId: number;
  amcContractId?: number | null;
  statusId: number;
  issuedById: number;
  issuedAt: string;
  dueDate?: string | null;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  status: StatusRef;
  issuedBy: { id: number; firstName: string; lastName: string };
  lineItems: InvoiceLineItemDto[];
}

export interface CreateInvoiceInput {
  entityType: 'AMC_CONTRACT' | 'SERVICE_TICKET';
  entityId: number;
  amcContractId?: number;
  dueDate?: string;
  notes?: string;
  lineItems: Array<{ description: string; quantity?: number; unitPrice: number }>;
}

export interface BreakdownEscalationDto {
  id: number;
  escalationCode: string;
  liftId: number;
  leadId?: number | null;
  statusId: number;
  triggeredAt: string;
  breakdownCount: number;
  windowDays: number;
  reviewedById?: number | null;
  reviewedAt?: string | null;
  resolution?: string | null;
  notes?: string | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  status: StatusRef;
  lift: { id: number; serialNumber: string };
  reviewedBy: { id: number; firstName: string; lastName: string } | null;
}

export interface AcknowledgeEscalationInput {
  resolution: 'RESOLVED_IN_AMC' | 'ROUTED_TO_MODERNIZATION';
  notes: string;
}

export type AmcTier = 'BASIC' | 'STANDARD' | 'PREMIUM';
