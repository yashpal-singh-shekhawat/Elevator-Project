-- CreateTable
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lift_types" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lift_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "gst_number" TEXT,
    "billing_address" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lifts" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,
    "lift_type_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "serial_number" TEXT NOT NULL,
    "model" TEXT,
    "capacity_kg" INTEGER,
    "number_of_floors" INTEGER,
    "installation_date" TIMESTAMP(3),
    "warranty_expiry_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_projects" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "project_code" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "site_id" INTEGER NOT NULL,
    "lift_type_id" INTEGER NOT NULL,
    "lift_id" INTEGER,
    "status_id" INTEGER NOT NULL,
    "assigned_engineer_id" INTEGER,
    "planned_start_date" TIMESTAMP(3),
    "planned_end_date" TIMESTAMP(3),
    "actual_start_date" TIMESTAMP(3),
    "actual_end_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_tasks" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "installation_project_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status_id" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "assigned_to_id" INTEGER,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "installation_milestones" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "installation_project_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status_id" INTEGER NOT NULL,
    "sign_off_by_id" INTEGER,
    "sign_off_at" TIMESTAMP(3),
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "installation_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amc_contracts" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "contract_number" TEXT NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "lift_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "contract_value" DECIMAL(12,2),
    "number_of_services_per_year" INTEGER NOT NULL DEFAULT 4,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amc_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amc_schedules" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "amc_contract_id" INTEGER NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amc_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amc_visits" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "amc_contract_id" INTEGER NOT NULL,
    "amc_schedule_id" INTEGER,
    "lift_id" INTEGER NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "status_id" INTEGER NOT NULL,
    "technician_id" INTEGER,
    "visit_date" TIMESTAMP(3) NOT NULL,
    "findings" TEXT,
    "actions_taken" TEXT,
    "next_service_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_by_id" INTEGER,
    "updated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amc_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "is_checked" BOOLEAN NOT NULL DEFAULT false,
    "checked_by_id" INTEGER,
    "checked_at" TIMESTAMP(3),
    "remarks" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_assets" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "organizations_tenant_id_idx" ON "organizations"("tenant_id");

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_code_key" ON "roles"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "users_tenant_id_organization_id_idx" ON "users"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_email_key" ON "users"("tenant_id", "email");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "statuses_tenant_id_entity_type_idx" ON "statuses"("tenant_id", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_tenant_id_entity_type_code_key" ON "statuses"("tenant_id", "entity_type", "code");

-- CreateIndex
CREATE INDEX "lift_types_tenant_id_idx" ON "lift_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "lift_types_tenant_id_code_key" ON "lift_types"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "service_types_tenant_id_idx" ON "service_types"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_types_tenant_id_code_key" ON "service_types"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "customers_tenant_id_organization_id_idx" ON "customers"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "sites_tenant_id_organization_id_idx" ON "sites"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "sites_customer_id_idx" ON "sites"("customer_id");

-- CreateIndex
CREATE INDEX "lifts_tenant_id_organization_id_idx" ON "lifts"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "lifts_site_id_idx" ON "lifts"("site_id");

-- CreateIndex
CREATE UNIQUE INDEX "lifts_tenant_id_serial_number_key" ON "lifts"("tenant_id", "serial_number");

-- CreateIndex
CREATE UNIQUE INDEX "installation_projects_lift_id_key" ON "installation_projects"("lift_id");

-- CreateIndex
CREATE INDEX "installation_projects_tenant_id_organization_id_idx" ON "installation_projects"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "installation_projects_status_id_idx" ON "installation_projects"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "installation_projects_tenant_id_project_code_key" ON "installation_projects"("tenant_id", "project_code");

-- CreateIndex
CREATE INDEX "installation_tasks_tenant_id_idx" ON "installation_tasks"("tenant_id");

-- CreateIndex
CREATE INDEX "installation_tasks_installation_project_id_idx" ON "installation_tasks"("installation_project_id");

-- CreateIndex
CREATE INDEX "installation_tasks_assigned_to_id_idx" ON "installation_tasks"("assigned_to_id");

-- CreateIndex
CREATE INDEX "installation_milestones_tenant_id_idx" ON "installation_milestones"("tenant_id");

-- CreateIndex
CREATE INDEX "installation_milestones_installation_project_id_idx" ON "installation_milestones"("installation_project_id");

-- CreateIndex
CREATE INDEX "amc_contracts_tenant_id_organization_id_idx" ON "amc_contracts"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "amc_contracts_lift_id_idx" ON "amc_contracts"("lift_id");

-- CreateIndex
CREATE INDEX "amc_contracts_status_id_idx" ON "amc_contracts"("status_id");

-- CreateIndex
CREATE UNIQUE INDEX "amc_contracts_tenant_id_contract_number_key" ON "amc_contracts"("tenant_id", "contract_number");

-- CreateIndex
CREATE INDEX "amc_schedules_tenant_id_idx" ON "amc_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "amc_schedules_amc_contract_id_idx" ON "amc_schedules"("amc_contract_id");

-- CreateIndex
CREATE INDEX "amc_schedules_scheduled_date_idx" ON "amc_schedules"("scheduled_date");

-- CreateIndex
CREATE INDEX "amc_visits_tenant_id_idx" ON "amc_visits"("tenant_id");

-- CreateIndex
CREATE INDEX "amc_visits_amc_contract_id_idx" ON "amc_visits"("amc_contract_id");

-- CreateIndex
CREATE INDEX "amc_visits_lift_id_idx" ON "amc_visits"("lift_id");

-- CreateIndex
CREATE INDEX "amc_visits_technician_id_idx" ON "amc_visits"("technician_id");

-- CreateIndex
CREATE INDEX "checklist_items_tenant_id_idx" ON "checklist_items"("tenant_id");

-- CreateIndex
CREATE INDEX "checklist_items_entity_type_entity_id_idx" ON "checklist_items"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "file_assets_tenant_id_organization_id_idx" ON "file_assets"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "file_assets_entity_type_entity_id_idx" ON "file_assets"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_organization_id_idx" ON "audit_logs"("tenant_id", "organization_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_tenant_id_idx" ON "activity_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifts" ADD CONSTRAINT "lifts_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifts" ADD CONSTRAINT "lifts_lift_type_id_fkey" FOREIGN KEY ("lift_type_id") REFERENCES "lift_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lifts" ADD CONSTRAINT "lifts_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_projects" ADD CONSTRAINT "installation_projects_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_projects" ADD CONSTRAINT "installation_projects_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_projects" ADD CONSTRAINT "installation_projects_lift_type_id_fkey" FOREIGN KEY ("lift_type_id") REFERENCES "lift_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_projects" ADD CONSTRAINT "installation_projects_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_projects" ADD CONSTRAINT "installation_projects_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "lifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_tasks" ADD CONSTRAINT "installation_tasks_installation_project_id_fkey" FOREIGN KEY ("installation_project_id") REFERENCES "installation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_tasks" ADD CONSTRAINT "installation_tasks_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_tasks" ADD CONSTRAINT "installation_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_milestones" ADD CONSTRAINT "installation_milestones_installation_project_id_fkey" FOREIGN KEY ("installation_project_id") REFERENCES "installation_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "installation_milestones" ADD CONSTRAINT "installation_milestones_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_contracts" ADD CONSTRAINT "amc_contracts_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_schedules" ADD CONSTRAINT "amc_schedules_amc_contract_id_fkey" FOREIGN KEY ("amc_contract_id") REFERENCES "amc_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_schedules" ADD CONSTRAINT "amc_schedules_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_schedules" ADD CONSTRAINT "amc_schedules_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_visits" ADD CONSTRAINT "amc_visits_amc_contract_id_fkey" FOREIGN KEY ("amc_contract_id") REFERENCES "amc_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_visits" ADD CONSTRAINT "amc_visits_amc_schedule_id_fkey" FOREIGN KEY ("amc_schedule_id") REFERENCES "amc_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_visits" ADD CONSTRAINT "amc_visits_lift_id_fkey" FOREIGN KEY ("lift_id") REFERENCES "lifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_visits" ADD CONSTRAINT "amc_visits_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_visits" ADD CONSTRAINT "amc_visits_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amc_visits" ADD CONSTRAINT "amc_visits_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checked_by_id_fkey" FOREIGN KEY ("checked_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
