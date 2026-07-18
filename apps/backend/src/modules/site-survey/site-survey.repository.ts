import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { PrismaListArgs } from '@common/utils/pagination';

export class SiteSurveyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private get include() {
    return {
      surveyedBy: { select: { id: true, firstName: true, lastName: true } },
      installationProject: { select: { id: true, title: true } },
    };
  }

  findMany(tenant: TenantContext, where: Prisma.SiteSurveyWhereInput, listArgs: PrismaListArgs) {
    return this.prisma.siteSurvey.findMany({
      where: { tenantId: tenant.tenantId, ...where },
      include: this.include,
      ...listArgs,
    });
  }

  count(tenant: TenantContext, where: Prisma.SiteSurveyWhereInput) {
    return this.prisma.siteSurvey.count({ where: { tenantId: tenant.tenantId, ...where } });
  }

  findById(tenant: TenantContext, id: number) {
    return this.prisma.siteSurvey.findFirst({
      where: { id, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  findByProjectId(tenant: TenantContext, installationProjectId: number) {
    return this.prisma.siteSurvey.findFirst({
      where: { installationProjectId, tenantId: tenant.tenantId },
      include: this.include,
    });
  }

  create(tenant: TenantContext, data: any) {
    return this.prisma.siteSurvey.create({
      data: { ...data, tenantId: tenant.tenantId, organizationId: tenant.organizationId },
      include: this.include,
    });
  }

  update(id: number, data: Prisma.SiteSurveyUpdateInput) {
    return this.prisma.siteSurvey.update({ where: { id }, data, include: this.include });
  }
}
