import * as controller from '../../../src/controllers/movie.controller';
import * as movieService from '../../../src/services/movie.service';
import { mockRequest, mockResponse } from '../../helpers/http';

jest.mock('../../../src/services/movie.service');

const service = jest.mocked(movieService);
const user = { id: 'u1', role: 'user' as const };
const movie = { _id: 'm1', title: 'Inception' };

beforeEach(() => {
  jest.resetAllMocks();
});

describe('movie controller', () => {
  it('lists movies with pagination', async () => {
    const result = { data: [movie], pagination: { page: 1, limit: 10, total: 1 } };
    service.listMovies.mockResolvedValue(result as never);
    const req = mockRequest({ query: { page: 1, limit: 10 } as never });
    const res = mockResponse();

    await controller.listMovies(req, res);

    expect(service.listMovies).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it('gets a movie by id', async () => {
    service.getMovie.mockResolvedValue(movie as never);
    const res = mockResponse();

    await controller.getMovie(mockRequest({ params: { id: 'm1' } }), res);

    expect(service.getMovie).toHaveBeenCalledWith('m1');
    expect(res.json).toHaveBeenCalledWith({ data: movie });
  });

  it('creates a movie as the current user and returns 201', async () => {
    service.createMovie.mockResolvedValue(movie as never);
    const res = mockResponse();

    await controller.createMovie(mockRequest({ body: { title: 'Inception' }, user }), res);

    expect(service.createMovie).toHaveBeenCalledWith({ title: 'Inception' }, 'u1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: movie });
  });

  it('updates a movie on behalf of the current user', async () => {
    service.updateMovie.mockResolvedValue(movie as never);
    const res = mockResponse();

    await controller.updateMovie(
      mockRequest({ params: { id: 'm1' }, body: { title: 'New' }, user }),
      res,
    );

    expect(service.updateMovie).toHaveBeenCalledWith('m1', { title: 'New' }, user);
    expect(res.json).toHaveBeenCalledWith({ data: movie });
  });

  it('deletes a movie and returns 204', async () => {
    const res = mockResponse();
    res.end = jest.fn().mockReturnValue(res);

    await controller.deleteMovie(mockRequest({ params: { id: 'm1' }, user }), res);

    expect(service.deleteMovie).toHaveBeenCalledWith('m1', user);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });
});
