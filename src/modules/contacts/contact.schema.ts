import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

export const updateContactStatusSchema = z.object({
  status: z.enum(["NEW", "READ"]),
});
