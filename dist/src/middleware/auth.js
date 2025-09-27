import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../../src/utils/jwt";
export function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ status: "fail", message: "Missing token" });
    }
    const token = auth.slice("Bearer ".length);
    try {
        const payload = verifyToken(token);
        req.user = payload;
        next();
    }
    catch {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ status: "fail", message: "Invalid token" });
    }
}
export function requireAdmin(req, res, next) {
    if (req.user?.role !== "ADMIN") {
        return res
            .status(StatusCodes.FORBIDDEN)
            .json({ status: "fail", message: "Admin only" });
    }
    next();
}
