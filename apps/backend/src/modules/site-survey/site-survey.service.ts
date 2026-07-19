import { Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError, BadRequestError } from '@common/errors';
import { toPrismaListArgs } from '@common/utils/pagination';
import { SiteSurveyRepository } from './site-survey.repository';
import { CreateSiteSurveyInput, UpdateSiteSurveyInput } from './site-survey.validation';

const SORT_FIELDS = ['id', 'createdAt', 'surveyedAt'] as const;

export class SiteSurveyService {
  constructor(private readonly repo: SiteSurveyRepository) {}

  async list(tenant: TenantContext, query: any) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.SiteSurveyWhereInput = {
      ...(query.installationProjectId ? { installationProjectId: query.installationProjectId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, listArgs),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const survey = await this.repo.findById(tenant, id);
    if (!survey) throw new NotFoundError('SiteSurvey');
    return survey;
  }

  async getByProjectId(tenant: TenantContext, installationProjectId: number) {
    const survey = await this.repo.findByProjectId(tenant, installationProjectId);
    if (!survey) throw new NotFoundError('SiteSurvey');
    return survey;
  }

  async create(tenant: TenantContext, input: CreateSiteSurveyInput) {
    const existing = await this.repo.findByProjectId(tenant, input.installationProjectId);
    if (existing) throw new BadRequestError('A site survey already exists for this project');
    return this.repo.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateSiteSurveyInput) {
    await this.getById(tenant, id);
    return this.repo.update(id, input as any);
  }
}
