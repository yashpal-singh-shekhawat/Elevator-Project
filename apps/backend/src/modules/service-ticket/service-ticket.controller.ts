import { Request, Response } from 'express';
import { asyncHandler } from '@common/utils/async-handler';
import { ApiResponse } from '@common/responses/api-response';
import { respondWithList } from '@common/utils/list-response';
import { IdParam } from '@common/validation/common.schemas';
import { ServiceTicketService } from './service-ticket.service';
import { CreateServiceTicketInput, UpdateServiceTicketInput, ListServiceTicketsQuery } from './service-ticket.validation';

export class ServiceTicketController {
  constructor(private readonly service: ServiceTicketService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListServiceTicketsQuery;
    await respondWithList(res, query, () => this.service.list(req.tenantContext, query));
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    ApiResponse.success(res, await this.service.getById(req.tenantContext, id));
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const ticket = await this.service.create(req.tenantContext, req.body as CreateServiceTicketInput);
    await req.audit.log({ entityType: 'SERVICE_TICKET', entityId: ticket.id, action: 'CREATE' });
    await req.audit.activity('SERVICE_TICKET', ticket.id, `Ticket "${ticket.ticketCode}" opened (${ticket.source})`);
    ApiResponse.created(res, ticket);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const ticket = await this.service.update(req.tenantContext, id, req.body as UpdateServiceTicketInput);
    await req.audit.log({ entityType: 'SERVICE_TICKET', entityId: ticket.id, action: 'UPDATE' });
    ApiResponse.success(res, ticket);
  });

  categorize = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { categoryTag, priorityFlag } = req.body;
    const ticket = await this.service.categorize(req.tenantContext, id, categoryTag, priorityFlag);
    await req.audit.log({ entityType: 'SERVICE_TICKET', entityId: ticket.id, action: 'CATEGORIZE' });
    await req.audit.activity('SERVICE_TICKET', ticket.id, `Ticket categorized: ${categoryTag}`);
    ApiResponse.success(res, ticket);
  });

  assign = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const ticket = await this.service.assign(req.tenantContext, id, req.body.technicianId);
    await req.audit.log({ entityType: 'SERVICE_TICKET', entityId: ticket.id, action: 'ASSIGN' });
    await req.audit.activity('SERVICE_TICKET', ticket.id, `Technician assigned: #${req.body.technicianId}`);
    ApiResponse.success(res, ticket);
  });

  start = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const ticket = await this.service.start(req.tenantContext, id);
    await req.audit.log({ entityType: 'SERVICE_TICKET', entityId: ticket.id, action: 'START' });
    ApiResponse.success(res, ticket);
  });

  resolve = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const { findings, recommendations, nextServiceDate } = req.body;
    const ticket = await this.service.resolve(req.tenantContext, id, findings, recommendations, nextServiceDate);
    await req.audit.log({ entityType: 'SERVICE_TICKET', entityId: ticket.id, action: 'RESOLVE' });
    await req.audit.activity('SERVICE_TICKET', ticket.id, `Ticket resolved`);
    ApiResponse.success(res, ticket);
  });

  close = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParam;
    const ticket = await this.service.close(req.tenantContext, id);
    await req.audit.log({ entityType: 'SERVICE_TICKET', entityId: ticket.id, action: 'CLOSE' });
    await req.audit.activity('SERVICE_TICKET', ticket.id, `Ticket closed`);
    ApiResponse.success(res, ticket);
  });
}
