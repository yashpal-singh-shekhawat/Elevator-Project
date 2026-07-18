-- CreateTable
CREATE TABLE "Lead" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "leadCode" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "customerId" INTEGER,
    "siteId" INTEGER,
    "statusId" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "source" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "modernizationFlag" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "quotationCode" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tier" TEXT,
    "statusId" INTEGER NOT NULL,
    "preparedById" INTEGER,
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2),
    "notes" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTransition" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "fromStatusId" INTEGER,
    "toStatusId" INTEGER NOT NULL,
    "actionedById" INTEGER NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplate" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistTemplateItem" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "checklistTemplateId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "quotationId" INTEGER,
    "invoiceId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT,
    "reference" TEXT,
    "verifiedById" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSurvey" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "installationProjectId" INTEGER NOT NULL,
    "surveyedById" INTEGER,
    "surveyedAt" TIMESTAMP(3),
    "pitDepthMm" INTEGER,
    "shaftWidthMm" INTEGER,
    "shaftDepthMm" INTEGER,
    "overheadClearanceMm" INTEGER,
    "powerAvailability" TEXT,
    "powerVoltage" INTEGER,
    "machineRoomAvailable" BOOLEAN,
    "floorCount" INTEGER,
    "buildingType" TEXT,
    "accessibilityNotes" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GadDesign" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "installationProjectId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "statusId" INTEGER NOT NULL,
    "preparedById" INTEGER,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "revisionNotes" TEXT,
    "notes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GadDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturingOrder" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "orderCode" TEXT NOT NULL,
    "installationProjectId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "releasedById" INTEGER,
    "releasedAt" TIMESTAMP(3),
    "qcPassedAt" TIMESTAMP(3),
    "qcPassedById" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "dispatchCode" TEXT NOT NULL,
    "manufacturingOrderId" INTEGER NOT NULL,
    "installationProjectId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "waybillNumber" TEXT,
    "carrierName" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "dispatchedById" INTEGER,
    "estimatedDeliveryDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "deliveryValidatedById" INTEGER,
    "exceptionNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceTicket" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "amcContractId" INTEGER NOT NULL,
    "liftId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "categoryTag" TEXT,
    "priorityFlag" TEXT NOT NULL DEFAULT 'NORMAL',
    "passengerEntrapped" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" INTEGER,
    "assignedAt" TIMESTAMP(3),
    "amcScheduleId" INTEGER,
    "findings" TEXT,
    "recommendations" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedById" INTEGER,
    "nextServiceDate" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "mrdCode" TEXT NOT NULL,
    "serviceTicketId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "raisedById" INTEGER NOT NULL,
    "coverageEligible" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRequestItem" (
    "id" SERIAL NOT NULL,
    "materialRequestId" INTEGER NOT NULL,
    "partNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "quantityIssued" INTEGER NOT NULL DEFAULT 0,
    "inventoryStockId" INTEGER,
    "vendorPoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryStock" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "partNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "description" TEXT,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "bisIsiCertified" BOOLEAN NOT NULL DEFAULT false,
    "unitCost" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "vendorCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "address" TEXT,
    "bisIsiApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPurchaseOrder" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "poCode" TEXT NOT NULL,
    "vendorId" INTEGER NOT NULL,
    "statusId" INTEGER NOT NULL,
    "raisedById" INTEGER NOT NULL,
    "expectedDelivery" TIMESTAMP(3),
    "grnReceivedAt" TIMESTAMP(3),
    "grnReceivedById" INTEGER,
    "bisIsiCertFlag" BOOLEAN NOT NULL DEFAULT false,
    "totalAmount" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "invoiceCode" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "amcContractId" INTEGER,
    "statusId" INTEGER NOT NULL,
    "issuedById" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakdownEscalation" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "escalationCode" TEXT NOT NULL,
    "liftId" INTEGER NOT NULL,
    "leadId" INTEGER,
    "statusId" INTEGER NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "breakdownCount" INTEGER NOT NULL,
    "windowDays" INTEGER NOT NULL DEFAULT 60,
    "reviewedById" INTEGER,
    "reviewedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "notes" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreakdownEscalation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_tenantId_vertical_idx" ON "Lead"("tenantId", "vertical");

-- CreateIndex
CREATE INDEX "Lead_tenantId_statusId_idx" ON "Lead"("tenantId", "statusId");

-- CreateIndex
CREATE INDEX "Quotation_tenantId_leadId_idx" ON "Quotation"("tenantId", "leadId");

-- CreateIndex
CREATE INDEX "Quotation_tenantId_statusId_idx" ON "Quotation"("tenantId", "statusId");

-- CreateIndex
CREATE INDEX "WorkflowTransition_tenantId_entityType_entityId_idx" ON "WorkflowTransition"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "ChecklistTemplate_tenantId_entityType_idx" ON "ChecklistTemplate"("tenantId", "entityType");

-- CreateIndex
CREATE INDEX "ChecklistTemplateItem_checklistTemplateId_idx" ON "ChecklistTemplateItem"("checklistTemplateId");

-- CreateIndex
CREATE INDEX "Payment_tenantId_entityType_entityId_idx" ON "Payment"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSurvey_installationProjectId_key" ON "SiteSurvey"("installationProjectId");

-- CreateIndex
CREATE INDEX "SiteSurvey_tenantId_idx" ON "SiteSurvey"("tenantId");

-- CreateIndex
CREATE INDEX "GadDesign_tenantId_installationProjectId_idx" ON "GadDesign"("tenantId", "installationProjectId");

-- CreateIndex
CREATE INDEX "ManufacturingOrder_tenantId_installationProjectId_idx" ON "ManufacturingOrder"("tenantId", "installationProjectId");

-- CreateIndex
CREATE INDEX "Dispatch_tenantId_installationProjectId_idx" ON "Dispatch"("tenantId", "installationProjectId");

-- CreateIndex
CREATE INDEX "ServiceTicket_tenantId_amcContractId_idx" ON "ServiceTicket"("tenantId", "amcContractId");

-- CreateIndex
CREATE INDEX "ServiceTicket_tenantId_statusId_idx" ON "ServiceTicket"("tenantId", "statusId");

-- CreateIndex
CREATE INDEX "ServiceTicket_tenantId_liftId_idx" ON "ServiceTicket"("tenantId", "liftId");

-- CreateIndex
CREATE INDEX "MaterialRequest_tenantId_serviceTicketId_idx" ON "MaterialRequest"("tenantId", "serviceTicketId");

-- CreateIndex
CREATE INDEX "MaterialRequestItem_materialRequestId_idx" ON "MaterialRequestItem"("materialRequestId");

-- CreateIndex
CREATE INDEX "InventoryStock_tenantId_idx" ON "InventoryStock"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryStock_tenantId_partNumber_key" ON "InventoryStock"("tenantId", "partNumber");

-- CreateIndex
CREATE INDEX "Vendor_tenantId_idx" ON "Vendor"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_tenantId_vendorCode_key" ON "Vendor"("tenantId", "vendorCode");

-- CreateIndex
CREATE INDEX "VendorPurchaseOrder_tenantId_vendorId_idx" ON "VendorPurchaseOrder"("tenantId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPurchaseOrder_tenantId_poCode_key" ON "VendorPurchaseOrder"("tenantId", "poCode");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_entityType_entityId_idx" ON "Invoice"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_invoiceCode_key" ON "Invoice"("tenantId", "invoiceCode");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "BreakdownEscalation_tenantId_liftId_idx" ON "BreakdownEscalation"("tenantId", "liftId");

-- CreateIndex
CREATE INDEX "BreakdownEscalation_tenantId_statusId_idx" ON "BreakdownEscalation"("tenantId", "statusId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_fromStatusId_fkey" FOREIGN KEY ("fromStatusId") REFERENCES "statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_toStatusId_fkey" FOREIGN KEY ("toStatusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "WorkflowTransition_actionedById_fkey" FOREIGN KEY ("actionedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTransition" ADD CONSTRAINT "wt_lead_fk" FOREIGN KEY ("entityId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistTemplateItem" ADD CONSTRAINT "ChecklistTemplateItem_checklistTemplateId_fkey" FOREIGN KEY ("checklistTemplateId") REFERENCES "ChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_installationProjectId_fkey" FOREIGN KEY ("installationProjectId") REFERENCES "installation_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSurvey" ADD CONSTRAINT "SiteSurvey_surveyedById_fkey" FOREIGN KEY ("surveyedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GadDesign" ADD CONSTRAINT "GadDesign_installationProjectId_fkey" FOREIGN KEY ("installationProjectId") REFERENCES "installation_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GadDesign" ADD CONSTRAINT "GadDesign_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GadDesign" ADD CONSTRAINT "GadDesign_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GadDesign" ADD CONSTRAINT "GadDesign_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_installationProjectId_fkey" FOREIGN KEY ("installationProjectId") REFERENCES "installation_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturingOrder" ADD CONSTRAINT "ManufacturingOrder_qcPassedById_fkey" FOREIGN KEY ("qcPassedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_manufacturingOrderId_fkey" FOREIGN KEY ("manufacturingOrderId") REFERENCES "ManufacturingOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_installationProjectId_fkey" FOREIGN KEY ("installationProjectId") REFERENCES "installation_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_dispatchedById_fkey" FOREIGN KEY ("dispatchedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispatch" ADD CONSTRAINT "Dispatch_deliveryValidatedById_fkey" FOREIGN KEY ("deliveryValidatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_amcContractId_fkey" FOREIGN KEY ("amcContractId") REFERENCES "amc_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_liftId_fkey" FOREIGN KEY ("liftId") REFERENCES "lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_amcScheduleId_fkey" FOREIGN KEY ("amcScheduleId") REFERENCES "amc_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceTicket" ADD CONSTRAINT "ServiceTicket_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_serviceTicketId_fkey" FOREIGN KEY ("serviceTicketId") REFERENCES "ServiceTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_materialRequestId_fkey" FOREIGN KEY ("materialRequestId") REFERENCES "MaterialRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "InventoryStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequestItem" ADD CONSTRAINT "MaterialRequestItem_vendorPoId_fkey" FOREIGN KEY ("vendorPoId") REFERENCES "VendorPurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPurchaseOrder" ADD CONSTRAINT "VendorPurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPurchaseOrder" ADD CONSTRAINT "VendorPurchaseOrder_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPurchaseOrder" ADD CONSTRAINT "VendorPurchaseOrder_raisedById_fkey" FOREIGN KEY ("raisedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPurchaseOrder" ADD CONSTRAINT "VendorPurchaseOrder_grnReceivedById_fkey" FOREIGN KEY ("grnReceivedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_amcContractId_fkey" FOREIGN KEY ("amcContractId") REFERENCES "amc_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownEscalation" ADD CONSTRAINT "BreakdownEscalation_liftId_fkey" FOREIGN KEY ("liftId") REFERENCES "lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownEscalation" ADD CONSTRAINT "BreakdownEscalation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownEscalation" ADD CONSTRAINT "BreakdownEscalation_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakdownEscalation" ADD CONSTRAINT "BreakdownEscalation_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
