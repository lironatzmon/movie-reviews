import { errorHandler } from '../../../src/middlewares/errorHandler';
import { AppError } from '../../../src/utils/AppError';
import { mockRequest, mockResponse } from '../../helpers/http';

function handle(error: unknown) {
  const res = mockResponse();
  errorHandler(error, mockRequest(), res, jest.fn());
  return res;
}

describe('errorHandler', () => {
  it('formats an AppError with its status and details', () => {
    const res = handle(new AppError(400, 'Validation failed', [{ path: 'title' }]));

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Validation failed', details: [{ path: 'title' }] },
    });
  });

  it('returns 400 for malformed JSON bodies', () => {
    const res = handle(Object.assign(new SyntaxError('bad'), { type: 'entity.parse.failed' }));

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('hides unknown errors behind a 500', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = handle(new Error('db exploded'));

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Internal server error' } });
  });
});
