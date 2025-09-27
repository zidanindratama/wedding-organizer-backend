import { Router } from "express";
import { login } from "./auth.controller.js";
import { validateBody } from "@/middleware/validate.js";
import { loginSchema } from "./auth.schema.js";

const router = Router();

router.post("/login", validateBody(loginSchema), login);

export default router;
