import { Prisma } from '@prisma/client';
import { LiftRepository } from './lift.repository';
import { SiteRepository } from '@modules/sites/site.repository';
import { LiftTypeRepository } from '@modules/master-data/lift-type/lift-type.repository';
import { StatusRepository } from '@modules/master-data/status/status.repository';
import { TenantContext } from '@common/types/tenant-context';
import { ListQuery, toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { BadRequestError, NotFoundError } from '@common/errors';
import { CreateLiftInput, ListLiftsQuery, UpdateLiftInput } from './lift.validation';

const SORT_FIELDS = ['serialNumber', 'installationDate', 'createdAt'] as const;
const SEARCH_FIELDS = ['serialNumber', 'model'] as const;
const LIFT_STATUS_ENTITY_TYPE = 'LIFT';

export class LiftService {
  constructor(
    private readonly liftRepository: LiftRepository,
    private readonly siteRepository: SiteRepository,
    private readonly liftTypeRepository: LiftTypeRepository,
    private readonly statusRepository: StatusRepository
  ) {}

  async list(tenant: TenantContext, query: ListLiftsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const where: Prisma.LiftWhereInput = {
      ...(query.siteId ? { siteId: query.siteId } : {}),
      ...(query.liftTypeId ? { liftTypeId: query.liftTypeId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(buildSearchWhere(query.search, SEARCH_FIELDS) ?? {})
    };

    const [items, totalItems] = await Promise.all([
      this.liftRepository.findMany(tenant, where, listArgs),
      this.liftRepository.count(tenant, where)
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const lift = await this.liftRepository.findById(tenant, id);
    if (!lift) throw new NotFoundError('Lift');
    return lift;
  }

  async create(tenant: TenantContext, input: CreateLiftInput) {
    await this.assertReferencesValid(tenant, input.siteId, input.liftTypeId, input.statusId);
    return this.liftRepository.create(tenant, input);
  }

  async update(tenant: TenantContext, id: number, input: UpdateLiftInput) {
    await this.getById(tenant, id); // 404s if missing/wrong tenant
    if (input.liftTypeId || input.statusId) {
      await this.assertReferencesValid(tenant, undefined, input.liftTypeId, input.statusId);
    }
    return this.liftRepository.update(id, input);
  }

  async softDelete(tenant: TenantContext, id: number): Promise<void> {
    await this.getById(tenant, id);
    await this.liftRepository.softDelete(id);
  }

  private async assertReferencesValid(
    tenant: TenantContext,
    siteId?: number,
    liftTypeId?: number,
    statusId?: number
  ): Promise<void> {
    const checks: Promise<void>[] = [];

    if (siteId !== undefined) {
      checks.push(
        this.siteRepository.findById(tenant, siteId).then((site) => {
          if (!site) throw new BadRequestError('Invalid siteId');
        })
      );
    }
    if (liftTypeId !== undefined) {
      checks.push(
        this.liftTypeRepository.findById(tenant, liftTypeId).then((liftType) => {
          if (!liftType || !liftType.isActive) throw new BadRequestError('Invalid or inactive liftTypeId');
        })
      );
    }
    if (statusId !== undefined) {
      checks.push(
        this.statusRepository.findActiveByEntityTypeAndId(tenant, LIFT_STATUS_ENTITY_TYPE, statusId).then((status) => {
          if (!status) throw new BadRequestError(`Invalid statusId for entity type "${LIFT_STATUS_ENTITY_TYPE}"`);
        })
      );
    }

    await Promise.all(checks);
  }
}
