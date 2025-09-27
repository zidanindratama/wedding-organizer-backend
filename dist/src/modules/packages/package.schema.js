import { z } from "zod";
export const createPackageSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().positive(),
    isActive: z.boolean().optional(),
    imageUrl: z.string().url().optional(),
});
export const updatePackageSchema = createPackageSchema.partial();
