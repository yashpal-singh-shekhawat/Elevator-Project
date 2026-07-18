import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';

export class ChecklistTemplateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      items: { where: { isActive: true }, orderBy: { sortOrder: 'asc' as const } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.ChecklistTemplateWhereInput, skip: number, take: number) {
    return this.prisma.checklistTemplate.findMany({
      where: { tenantId: tenant.tenantId, isActive: true, ...where },
      include: this.include,
      skip,
      take,
      orderBy: { name: 'asc' },
    });
  }

  count(tenant: TenantContext, where: Prisma.ChecklistTemplateWhereInput) {
    return this.prisma.checklistTemplate.count({
      where: { tenantId: tenant.tenantId, isActive: true, ...where },
    });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.checklistTemplate.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  create(tenant: TenantContext, data: { name: string; description?: string; entityType: string }) {
    return this.prisma.checklistTemplate.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: this.include,
    });
  }

  createItems(
    tenantId: number,
    organizationId: number,
    templateId: number,
    items: Array<{ label: string; sortOrder: number }>
  ) {
    return this.prisma.checklistTemplateItem.createMany({
      data: items.map((i) => ({
        label: i.label,
        sortOrder: i.sortOrder,
        checklistTemplateId: templateId,
        tenantId,
        organizationId,
      })),
    });
  }

  update(id: number, data: Prisma.ChecklistTemplateUpdateInput) {
    return this.prisma.checklistTemplate.update({ where: { id }, data, include: this.include });
  }

  async applyTemplate(tenant: TenantContext, templateId: number, entityType: string, entityId: number) {
    const template = await this.findById(tenant, templateId);
    if (!template) return null;

    await this.prisma.checklistItem.createMany({
      data: template.items.map((item, idx) => ({
        tenantId: tenant.tenantId,
        organizationId: tenant.organizationId,
        entityType,
        entityId,
        label: item.label,
        sortOrder: item.sortOrder ?? idx,
        isChecked: false,
      })),
    });
    return { applied: template.items.length, templateName: template.name };
  }
}
