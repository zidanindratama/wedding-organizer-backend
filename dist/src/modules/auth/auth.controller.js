import { StatusCodes } from "http-status-codes";
import { prisma } from "../../db/prisma.js";
import { signToken } from "../../utils/jwt.js";
import { comparePassword } from "../../utils/password.js";
export async function login(req, res) {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ status: "fail", message: "Invalid credentials" });
    }
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ status: "fail", message: "Invalid credentials" });
    }
    const token = signToken({
        userId: user.id,
        role: user.role,
        email: user.email,
    });
    return res.json({
        status: "success",
        data: {
            accessToken: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        },
    });
}
