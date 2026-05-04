import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { container } from 'tsyringe';
import type { MiddlewareHandler } from 'hono';
import { ListPersonsUseCase } from '../../domains/person/usecases/ListPersonsUseCase.js';
import { CreatePersonUseCase } from '../../domains/person/usecases/CreatePersonUseCase.js';
import { UpdatePersonUseCase } from '../../domains/person/usecases/UpdatePersonUseCase.js';
import { DeletePersonUseCase } from '../../domains/person/usecases/DeletePersonUseCase.js';
import {
  personListResponseSchema,
  personResponseSchema,
  createPersonSchema,
  updatePersonSchema,
} from '../../domains/person/schemas/person.schema.js';
import type { AppEnv } from '../../types/hono.js';
import type { Person } from '../../domains/person/entities/Person.js';

const errorSchema = z.object({ error: z.string(), code: z.string() });
const budgetIdParam = z.object({ id: z.string() });
const personParams = z.object({ id: z.string(), pid: z.string() });

function toResponse(p: Person) {
  return {
    id: p.id,
    budgetId: p.budgetId,
    type: p.type,
    name: p.name,
    sex: p.sex,
    dob: p.dob ? p.dob.toISOString() : null,
    plannedDob: p.plannedDob ? p.plannedDob.toISOString() : null,
    age: p.age,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

const listRoute = createRoute({
  method: 'get',
  path: '/{id}/persons',
  tags: ['Persons'],
  summary: 'List persons in a budget',
  request: { params: budgetIdParam },
  responses: {
    200: {
      content: { 'application/json': { schema: personListResponseSchema } },
      description: 'OK',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const createRoute_ = createRoute({
  method: 'post',
  path: '/{id}/persons',
  tags: ['Persons'],
  summary: 'Add a person to a budget',
  request: {
    params: budgetIdParam,
    body: { content: { 'application/json': { schema: createPersonSchema } } },
  },
  responses: {
    201: {
      content: { 'application/json': { schema: personResponseSchema } },
      description: 'Created',
    },
    400: {
      content: { 'application/json': { schema: errorSchema } },
      description: 'Validation error',
    },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
  },
});

const updateRoute = createRoute({
  method: 'patch',
  path: '/{id}/persons/{pid}',
  tags: ['Persons'],
  summary: 'Update a person',
  request: {
    params: personParams,
    body: { content: { 'application/json': { schema: updatePersonSchema } } },
  },
  responses: {
    200: { content: { 'application/json': { schema: personResponseSchema } }, description: 'OK' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/{id}/persons/{pid}',
  tags: ['Persons'],
  summary: 'Delete a person',
  request: { params: personParams },
  responses: {
    204: { description: 'Deleted' },
    403: { content: { 'application/json': { schema: errorSchema } }, description: 'Forbidden' },
    404: { content: { 'application/json': { schema: errorSchema } }, description: 'Not found' },
  },
});

export function createPersonController(authMiddleware: MiddlewareHandler<AppEnv>) {
  const app = new OpenAPIHono<AppEnv>();
  app.use('*', authMiddleware);

  app.openapi(listRoute, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const useCase = container.resolve(ListPersonsUseCase);
    const persons = await useCase.execute(id, user.id);
    return c.json(persons.map(toResponse), 200);
  });

  app.openapi(createRoute_, async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(CreatePersonUseCase);
    const person = await useCase.execute(id, user.id, {
      type: body.type,
      name: body.name,
      sex: body.sex,
      dob: body.dob ? new Date(body.dob) : undefined,
      plannedDob: body.plannedDob ? new Date(body.plannedDob) : undefined,
    });
    return c.json(toResponse(person), 201);
  });

  app.openapi(updateRoute, async (c) => {
    const user = c.get('user');
    const { id, pid } = c.req.valid('param');
    const body = c.req.valid('json');
    const useCase = container.resolve(UpdatePersonUseCase);
    const person = await useCase.execute(id, pid, user.id, {
      name: body.name,
      sex: body.sex,
      dob: body.dob === null ? null : body.dob ? new Date(body.dob) : undefined,
      plannedDob:
        body.plannedDob === null ? null : body.plannedDob ? new Date(body.plannedDob) : undefined,
    });
    return c.json(toResponse(person), 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const user = c.get('user');
    const { id, pid } = c.req.valid('param');
    const useCase = container.resolve(DeletePersonUseCase);
    await useCase.execute(id, pid, user.id);
    return c.body(null, 204);
  });

  return app;
}
