import { describe, it, expect } from 'vitest';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  ConflictError,
} from '../../../../infrastructure/errors/DomainError.js';

describe('DomainError', () => {
  it('sets message, code, and statusCode', () => {
    const err = new DomainError('something broke', 'BROKEN', 400);
    expect(err.message).toBe('something broke');
    expect(err.code).toBe('BROKEN');
    expect(err.statusCode).toBe(400);
    expect(err).toBeInstanceOf(Error);
  });

  it('name matches class name', () => {
    const err = new DomainError('msg', 'CODE');
    expect(err.name).toBe('DomainError');
  });
});

describe('NotFoundError', () => {
  it('has correct code and 404 status', () => {
    const err = new NotFoundError('Budget not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Budget not found');
    expect(err).toBeInstanceOf(DomainError);
  });
});

describe('UnauthorizedError', () => {
  it('defaults to "Unauthorized" message with 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.message).toBe('Unauthorized');
  });

  it('accepts a custom message', () => {
    const err = new UnauthorizedError('Token expired');
    expect(err.message).toBe('Token expired');
  });
});

describe('ForbiddenError', () => {
  it('has 403 status and FORBIDDEN code', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
  });
});

describe('ValidationError', () => {
  it('has 400 status', () => {
    const err = new ValidationError('Name is required');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Name is required');
  });
});

describe('ConflictError', () => {
  it('has 409 status', () => {
    const err = new ConflictError('Email already taken');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
  });
});
