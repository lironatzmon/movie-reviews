import { Request, Response } from 'express';
import * as reviewService from '../services/review.service';

type PaginationQuery = { page: number; limit: number };

export async function listReviews(req: Request, res: Response) {
  const query = req.query as unknown as PaginationQuery;
  res.json(await reviewService.listReviews(req.params.movieId as string, query));
}

export async function createReview(req: Request, res: Response) {
  const review = await reviewService.createReview(
    req.params.movieId as string,
    req.body,
    req.user!.id,
  );
  res.status(201).json({ data: review });
}

export async function updateReview(req: Request, res: Response) {
  const review = await reviewService.updateReview(req.params.id as string, req.body, req.user!);
  res.json({ data: review });
}

export async function deleteReview(req: Request, res: Response) {
  await reviewService.deleteReview(req.params.id as string, req.user!);
  res.status(204).end();
}

export async function getMovieRating(req: Request, res: Response) {
  res.json({ data: await reviewService.getMovieRating(req.params.id as string) });
}
