import { z } from 'zod';
import { ROLES } from '../types/auth';

export const updateRoleSchema = z.object({ role: z.enum(ROLES) });
