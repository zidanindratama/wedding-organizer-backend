import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import authRoutes from "./modules/auth/auth.routes.js";
import packageRoutes from "./modules/packages/package.routes.js";
import orderRoutes from "./modules/orders/order.routes.js";
import contactRoutes from "./modules/contacts/contact.routes.js";
import reportRoutes from "./modules/reports/report.routes.js";
const app = express();
const corsOptions = {
    origin: ["http://localhost:3000", "https://your-frontend-domain.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
};
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", cors(corsOptions), authRoutes);
app.use("/api/v1/packages", cors(corsOptions), packageRoutes);
app.use("/api/v1/orders", cors(corsOptions), orderRoutes);
app.use("/api/v1/contacts", cors(corsOptions), contactRoutes);
app.use("/api/v1/reports", cors(corsOptions), reportRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
