import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { PageQuery } from '../utils/pagination';

export async function list(req: Request, res: Response) {
  const { users, pagination } = await userService.listUsers(req.query as unknown as PageQuery);
  res.status(200).json({ data: users, pagination });
}

export async function getById(req: Request, res: Response) {
  res.status(200).json({ data: await userService.getUser(req.params.id as string) });
}

export async function updateRole(req: Request, res: Response) {
  const user = await userService.updateRole(req.user!.id, req.params.id as string, req.body.role);
  res.status(200).json({ data: user });
}

export async function remove(req: Request, res: Response) {
  await userService.deleteUser(req.user!.id, req.params.id as string);
  res.status(204).send();
}
