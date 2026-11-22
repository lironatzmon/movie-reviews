import { Request, Response } from 'express';

export function mockRequest(overrides: Partial<Request> = {}): Request {
  return { headers: {}, body: {}, params: {}, query: {}, ...overrides } as Request;
}

export function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}
