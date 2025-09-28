import { Router } from "express";
import {
  createPackage,
  deletePackage,
  getPackage,
  listAllPackagesAdmin,
  listPackages,
  updatePackage,
} from "./package.controller.js";
import { createPackageSchema, updatePackageSchema } from "./package.schema.js";
import { requireAdmin, requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";

const router = Router();

router.get("/", listPackages);
router.get("/:id", getPackage);

router.get("/admin/all", requireAuth, requireAdmin, listAllPackagesAdmin);
router.post(
  "/",
  requireAuth,
  requireAdmin,
  validateBody(createPackageSchema),
  createPackage
);
router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  validateBody(updatePackageSchema),
  updatePackage
);
router.delete("/:id", requireAuth, requireAdmin, deletePackage);

export default router;
