import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '@common/types/tenant-context';
import { NotFoundError } from '@common/errors';
import { toPrismaListArgs, buildSearchWhere } from '@common/utils/pagination';
import { ServiceTicketRepository } from './service-ticket.repository';
import {
  CreateServiceTicketInput,
  UpdateServiceTicketInput,
  ListServiceTicketsQuery,
} from './service-ticket.validation';

const SORT_FIELDS = ['id', 'ticketCode', 'priorityFlag', 'createdAt'] as const;
const SEARCH_FIELDS = ['ticketCode', 'findings'] as const;
const ESCALATION_WINDOW_DAYS = 60;
const ESCALATION_THRESHOLD = 3;

export class ServiceTicketService {
  constructor(
    private readonly repo: ServiceTicketRepository,
    private readonly prisma: PrismaClient
  ) {}

  private async getStatus(tenantId: number, entityType: string, code: string) {
    return this.prisma.status.findFirst({ where: { tenantId, entityType, code } });
  }

  async list(tenant: TenantContext, query: ListServiceTicketsQuery) {
    const listArgs = toPrismaListArgs(query, SORT_FIELDS, 'createdAt');
    const searchWhere = buildSearchWhere(query.search, SEARCH_FIELDS) ?? {};
    const where: Prisma.ServiceTicketWhereInput = {
      ...searchWhere,
      ...(query.amcContractId ? { amcContractId: query.amcContractId } : {}),
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.assignedToId ? { assignedToId: query.assignedToId } : {}),
      ...(query.priorityFlag ? { priorityFlag: query.priorityFlag } : {}),
      ...(query.liftId ? { liftId: query.liftId } : {}),
    };
    const [items, totalItems] = await Promise.all([
      this.repo.findMany(tenant, where, listArgs),
      this.repo.count(tenant, where),
    ]);
    return { items, totalItems };
  }

  async getById(tenant: TenantContext, id: number) {
    const ticket = await this.repo.findById(tenant, id);
    if (!ticket) throw new NotFoundError('ServiceTicket');
    return ticket;
  }

  async create(tenant: TenantContext, input: CreateServiceTicketInput) {
    const status = await this.getStatus(tenant.tenantId, 'SERVICE_TICKET', 'TICKET_OPENED');
    // Passenger entrapment → always CRITICAL
    const priorityFlag = input.passengerEntrapped ? 'CRITICAL' : input.priorityFlag;
    return this.repo.create(tenant, {
      ...input,
      priorityFlag,
      ticketCode: `TKT-${Date.now()}`,
      statusId: status?.id,
    });
  }

  async update(tenant: TenantContext, id: number, input: UpdateServiceTicketInput) {
    await this.getById(tenant, id);
    return this.repo.update(id, input as any);
  }

  async categorize(tenant: TenantContext, id: number, categoryTag: string, priorityFlag?: string) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'SERVICE_TICKET', 'TRIAGED');
    return this.repo.update(id, {
      categoryTag,
      ...(priorityFlag ? { priorityFlag } : {}),
      status: { connect: { id: status?.id } },
    });
  }

  async assign(tenant: TenantContext, id: number, technicianId: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'SERVICE_TICKET', 'TECHNICIAN_ASSIGNED');
    return this.repo.update(id, {
      assignedTo: { connect: { id: technicianId } },
      assignedAt: new Date(),
      status: { connect: { id: status?.id } },
    });
  }

  async start(tenant: TenantContext, id: number) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'SERVICE_TICKET', 'IN_PROGRESS');
    return this.repo.update(id, { status: { connect: { id: status?.id } } });
  }

  async resolve(tenant: TenantContext, id: number, findings: string, recommendations?: string, nextServiceDate?: string) {
    await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'SERVICE_TICKET', 'RESOLVED');
    return this.repo.update(id, {
      findings,
      recommendations,
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
      resolvedAt: new Date(),
      status: { connect: { id: status?.id } },
    });
  }

  async close(tenant: TenantContext, id: number) {
    const ticket = await this.getById(tenant, id);
    const status = await this.getStatus(tenant.tenantId, 'SERVICE_TICKET', 'CLOSED');

    const updated = await this.repo.update(id, {
      status: { connect: { id: status?.id } },
      closedAt: new Date(),
    });

    // Auto-complete linked schedule
    if (ticket.amcScheduleId) {
      const scheduleCompletedStatus = await this.getStatus(tenant.tenantId, 'AMC_SCHEDULE', 'COMPLETED');
      if (scheduleCompletedStatus) {
        await this.prisma.amcSchedule.update({
          where: { id: ticket.amcScheduleId },
          data: { statusId: scheduleCompletedStatus.id },
        });
      }
    }

    // Check for breakdown escalation: 3+ closed tickets in 60 days for this lift
    const recentCount = await this.repo.countRecentClosedByLift(
      tenant.tenantId,
      ticket.liftId,
      ESCALATION_WINDOW_DAYS
    );

    if (recentCount >= ESCALATION_THRESHOLD) {
      const existingEscalation = await this.prisma.breakdownEscalation.findFirst({
        where: {
          tenantId: tenant.tenantId,
          liftId: ticket.liftId,
          closedAt: null,
        },
      });

      if (!existingEscalation) {
        const escalationStatus = await this.getStatus(tenant.tenantId, 'BREAKDOWN_ESCALATION', 'OPEN');
        await this.prisma.breakdownEscalation.create({
          data: {
            tenantId: tenant.tenantId,
            organizationId: tenant.organizationId,
            escalationCode: `ESC-${Date.now()}`,
            liftId: ticket.liftId,
            statusId: escalationStatus?.id ?? 0,
            breakdownCount: recentCount,
            windowDays: ESCALATION_WINDOW_DAYS,
          },
        });
      }
    }

    return updated;
  }
}
