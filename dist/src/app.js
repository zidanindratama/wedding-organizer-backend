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
const allowlist = new Set([
    "http://localhost:3000",
    "https://wedding-organizer-frontend.vercel.app",
]);
const corsOptions = {
    origin(origin, cb) {
        if (!origin)
            return cb(null, true);
        if (allowlist.has(origin))
            return cb(null, true);
        if (/^https:\/\/.*-wedding-organizer-frontend-.*\.vercel\.app$/.test(origin))
            return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.get("/api/v1/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/packages", packageRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/contacts", contactRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
