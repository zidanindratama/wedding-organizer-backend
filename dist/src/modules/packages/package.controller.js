import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../src/db/prisma";
function buildOrderBy(sort) {
    if (sort === "az")
        return { name: "asc" };
    if (sort === "za")
        return { name: "desc" };
    if (sort === "cheap")
        return { price: "asc" };
    if (sort === "expensive")
        return { price: "desc" };
    return { createdAt: "desc" };
}
function parsePageLimit(req) {
    const rawPage = Number((req.query.page ?? "1"));
    const rawLimit = Number((req.query.limit ?? "10"));
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    const limitBase = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 10;
    const limit = Math.min(Math.max(limitBase, 1), 100); // clamp 1..100
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}
function buildWhere(search, withIsActive = false) {
    const where = {};
    if (withIsActive)
        where.isActive = true;
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }
    return where;
}
export async function listPackages(req, res) {
    const { sort, search } = req.query;
    const orderBy = buildOrderBy(sort);
    const { page, limit, skip } = parsePageLimit(req);
    const where = buildWhere(search, true);
    const [total, data] = await Promise.all([
        prisma.package.count({ where }),
        prisma.package.findMany({ where, orderBy, skip, take: limit }),
    ]);
    const pageCount = Math.ceil(total / limit) || 1;
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
export async function listAllPackagesAdmin(req, res) {
    const { sort, search } = req.query;
    const orderBy = buildOrderBy(sort);
    const { page, limit, skip } = parsePageLimit(req);
    const where = buildWhere(search, false);
    const [total, data] = await Promise.all([
        prisma.package.count({ where }),
        prisma.package.findMany({ where, orderBy, skip, take: limit }),
    ]);
    const pageCount = Math.ceil(total / limit) || 1;
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
export async function getPackage(req, res) {
    const { id } = req.params;
    const data = await prisma.package.findUnique({ where: { id } });
    if (!data)
        return res
            .status(StatusCodes.NOT_FOUND)
            .json({ status: "fail", message: "Package not found" });
    return res.json({ status: "success", data });
}
export async function createPackage(req, res) {
    const { name, description, price, isActive = true, imageUrl, } = req.body;
    const data = await prisma.package.create({
        data: { name, description, price, isActive, imageUrl },
    });
    return res.status(StatusCodes.CREATED).json({ status: "success", data });
}
export async function updatePackage(req, res) {
    const { id } = req.params;
    const { price, ...rest } = req.body;
    const data = await prisma.package.update({
        where: { id },
        data: {
            ...rest,
            ...(typeof price === "number" ? { price } : {}),
        },
    });
    return res.json({ status: "success", data });
}
export async function deletePackage(req, res) {
    const { id } = req.params;
    await prisma.package.delete({ where: { id } });
    return res.json({ status: "success" });
}
