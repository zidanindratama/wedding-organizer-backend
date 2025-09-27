import { StatusCodes, getReasonPhrase } from "http-status-codes";
export function notFoundHandler(_req, res) {
    return res.status(StatusCodes.NOT_FOUND).json({
        status: "fail",
        message: "Route not found",
    });
}
export function errorHandler(err, _req, res, _next) {
    const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const msg = err.message || getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR);
    if (process.env.NODE_ENV !== "production") {
        console.error(err);
    }
    return res.status(status).json({
        status: "error",
        message: msg,
    });
}
