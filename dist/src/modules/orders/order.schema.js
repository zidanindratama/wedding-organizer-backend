import { z } from "zod";
export const createOrderSchema = z.object({
    packageId: z.string().min(1),
    customerName: z.string().min(1),
    customerEmail: z.string().email(),
    customerPhone: z.string().optional(),
    eventDate: z.string().datetime().optional(),
    venue: z.string().optional(),
    notes: z.string().optional(),
});
export const updateStatusSchema = z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});
