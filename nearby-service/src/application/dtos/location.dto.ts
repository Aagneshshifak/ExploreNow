import { z } from 'zod';

export const UpdateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  direction: z.number().min(0).max(360).optional(),
});

export type UpdateLocationDTO = z.infer<typeof UpdateLocationSchema>;
