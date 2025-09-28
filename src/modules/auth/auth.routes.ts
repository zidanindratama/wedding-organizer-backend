import { Router } from "express";
import { loginSchema } from "./auth.schema.js";
import { login } from "./auth.controller.js";
import { validateBody } from "../../middleware/validate.js";

const router = Router();

router.post("/login", validateBody(loginSchema), login);

export default router;
