import { StatusCodes } from "http-status-codes";
export function validateBody(schema) {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                status: "fail",
                message: "Validation error",
                issues: parsed.error.flatten(),
            });
        }
        req.body = parsed.data;
        next();
    };
}
