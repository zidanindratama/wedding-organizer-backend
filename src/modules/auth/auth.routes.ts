import { Router } from "express";
import { login } from "./auth.controller";
import { loginSchema } from "./auth.schema";
import { validateBody } from "src/middleware/validate";

const router = Router();

router.post("/login", validateBody(loginSchema), login);

export default router;
