import * as controller from '../../../src/controllers/review.controller';
import * as reviewService from '../../../src/services/review.service';
import { mockRequest, mockResponse } from '../../helpers/http';

jest.mock('../../../src/services/review.service');

const service = jest.mocked(reviewService);
const user = { id: 'u1', role: 'user' as const };
const review = { id: 'r1', rating: 8 };

beforeEach(() => {
  jest.resetAllMocks();
});

describe('review controller', () => {
  it('lists reviews of a movie', async () => {
    const result = { data: [review], pagination: { page: 1, limit: 10, total: 1 } };
    service.listReviews.mockResolvedValue(result as never);
    const res = mockResponse();

    await controller.listReviews(
      mockRequest({ params: { movieId: 'm1' }, query: { page: 1, limit: 10 } as never }),
      res,
    );

    expect(service.listReviews).toHaveBeenCalledWith('m1', { page: 1, limit: 10 });
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it('creates a review as the current user and returns 201', async () => {
    service.createReview.mockResolvedValue(review as never);
    const res = mockResponse();

    await controller.createReview(
      mockRequest({ params: { movieId: 'm1' }, body: { rating: 8, text: 'ok' }, user }),
      res,
    );

    expect(service.createReview).toHaveBeenCalledWith('m1', { rating: 8, text: 'ok' }, 'u1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ data: review });
  });

  it('updates a review on behalf of the current user', async () => {
    service.updateReview.mockResolvedValue(review as never);
    const res = mockResponse();

    await controller.updateReview(
      mockRequest({ params: { id: 'r1' }, body: { rating: 9 }, user }),
      res,
    );

    expect(service.updateReview).toHaveBeenCalledWith('r1', { rating: 9 }, user);
    expect(res.json).toHaveBeenCalledWith({ data: review });
  });

  it('deletes a review and returns 204', async () => {
    const res = mockResponse();
    res.end = jest.fn().mockReturnValue(res);

    await controller.deleteReview(mockRequest({ params: { id: 'r1' }, user }), res);

    expect(service.deleteReview).toHaveBeenCalledWith('r1', user);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns the movie rating', async () => {
    const rating = { averageRating: 8.5, reviewsCount: 2 };
    service.getMovieRating.mockResolvedValue(rating);
    const res = mockResponse();

    await controller.getMovieRating(mockRequest({ params: { id: 'm1' } }), res);

    expect(service.getMovieRating).toHaveBeenCalledWith('m1');
    expect(res.json).toHaveBeenCalledWith({ data: rating });
  });
});
