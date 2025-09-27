import { Router } from "express";
import {
  createContact,
  listContacts,
  updateContactStatus,
} from "./contact.controller";
import {
  createContactSchema,
  updateContactStatusSchema,
} from "./contact.schema";
import { requireAdmin, requireAuth } from "src/middleware/auth";
import { validateBody } from "src/middleware/validate";

const router = Router();

router.post("/", validateBody(createContactSchema), createContact);
router.get("/", requireAuth, requireAdmin, listContacts);
router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  validateBody(updateContactStatusSchema),
  updateContactStatus
);

export default router;
