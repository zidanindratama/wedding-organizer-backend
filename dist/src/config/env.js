import "dotenv/config";
export const env = {
    port: Number(process.env.PORT || 3000),
    nodeEnv: process.env.NODE_ENV || "development",
    jwtSecret: process.env.JWT_SECRET || "dev_secret",
    jwtExpiresIn: (process.env.JWT_EXPIRES_IN ??
        "1d"),
};
