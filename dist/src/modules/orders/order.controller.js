import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import { prisma } from "../../db/prisma.js";
function buildOrderBy(sort) {
    if (sort === "oldest")
        return { createdAt: "asc" };
    if (sort === "event_asc")
        return { eventDate: "asc" };
    if (sort === "event_desc")
        return { eventDate: "desc" };
    if (sort === "price_asc")
        return { totalPrice: "asc" };
    if (sort === "price_desc")
        return { totalPrice: "desc" };
    if (sort === "name_asc")
        return { customerName: "asc" };
    if (sort === "name_desc")
        return { customerName: "desc" };
    return { createdAt: "desc" };
}
function parsePageLimit(req) {
    const page = Math.max(1, Math.floor(Number(req.query.page ?? 1)));
    const limitRaw = Math.floor(Number(req.query.limit ?? 10));
    const limit = Math.min(100, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
function buildWhere(req) {
    const { q, status, packageId, userId, dateFrom, dateTo, minPrice, maxPrice, code, email, } = req.query;
    const where = {};
    if (code)
        where.orderCode = code;
    if (email)
        where.customerEmail = email;
    if (status)
        where.status = status;
    if (packageId)
        where.packageId = packageId;
    if (userId)
        where.userId = userId;
    if (dateFrom || dateTo) {
        where.eventDate = {};
        if (dateFrom)
            where.eventDate.gte = new Date(dateFrom);
        if (dateTo)
            where.eventDate.lte = new Date(dateTo);
    }
    if (minPrice || maxPrice) {
        where.totalPrice = {};
        if (minPrice)
            where.totalPrice.gte = Number(minPrice);
        if (maxPrice)
            where.totalPrice.lte = Number(maxPrice);
    }
    if (q) {
        where.OR = [
            { orderCode: { contains: q, mode: "insensitive" } },
            { customerName: { contains: q, mode: "insensitive" } },
            { customerEmail: { contains: q, mode: "insensitive" } },
            { customerPhone: { contains: q, mode: "insensitive" } },
            { venue: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
        ];
    }
    return where;
}
export async function createOrder(req, res) {
    const { packageId, customerName, customerEmail, customerPhone, eventDate, venue, notes, } = req.body;
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg || !pkg.isActive) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ status: "fail", message: "Invalid package" });
    }
    let user = await prisma.user.findUnique({ where: { email: customerEmail } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: customerEmail,
                name: customerName,
                passwordHash: "",
                role: "USER",
            },
        });
    }
    const orderCode = crypto.randomBytes(6).toString("hex").toUpperCase();
    const totalPrice = pkg.price;
    const created = await prisma.order.create({
        data: {
            orderCode,
            packageId,
            userId: user.id,
            customerName,
            customerEmail,
            customerPhone,
            eventDate: eventDate ? new Date(eventDate) : null,
            venue,
            status: "PENDING",
            totalPrice,
            notes,
        },
    });
    return res
        .status(StatusCodes.CREATED)
        .json({ status: "success", data: created });
}
export async function checkOrder(req, res) {
    const { code, email } = req.query;
    if (!code && !email) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ status: "fail", message: "Provide code or email" });
    }
    const { page, limit, skip } = parsePageLimit(req);
    const sort = req.query.sort || "newest";
    const orderBy = buildOrderBy(sort);
    const where = buildWhere(req);
    const [total, data] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: { package: true },
        }),
    ]);
    const pageCount = Math.max(1, Math.ceil(total / limit));
    return res.json({
        status: "success",
        meta: {
            page,
            limit,
            total,
            pageCount,
            hasNext: page < pageCount,
            hasPrev: page > 1,
        },
        data,
    });
}
export async function listOrders(req, res) {
    const { page, limit, skip } = parsePageLimit(req);
    const sort = req.query.sort;
    const orderBy = buildOrderBy(sort);
    const where = buildWhere(req);
    const [total, data] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            include: { package: true, user: true },
        }),
    ]);
    const pageCount = Math.max(1, Math.ceil(total / limit));
    return res.json({
        status: "success",
        meta: {
            page,
            limit,
            total,
            pageCount,
            hasNext: page < pageCount,
            hasPrev: page > 1,
        },
        data,
    });
}
export async function updateOrderStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await prisma.order.update({
        where: { id },
        data: { status },
        include: { package: true, user: true },
    });
    return res.json({ status: "success", data: updated });
}
