import { Request, Response } from 'express';
import * as movieService from '../services/movie.service';
import { ListMoviesQuery } from '../validators/movie.validator';

export async function listMovies(req: Request, res: Response) {
  res.json(await movieService.listMovies(req.query as unknown as ListMoviesQuery));
}

export async function getMovie(req: Request, res: Response) {
  res.json({ data: await movieService.getMovie(req.params.id as string) });
}

export async function createMovie(req: Request, res: Response) {
  res.status(201).json({ data: await movieService.createMovie(req.body, req.user!.id) });
}

export async function updateMovie(req: Request, res: Response) {
  const movie = await movieService.updateMovie(req.params.id as string, req.body, req.user!);
  res.json({ data: movie });
}

export async function deleteMovie(req: Request, res: Response) {
  await movieService.deleteMovie(req.params.id as string, req.user!);
  res.status(204).end();
}
