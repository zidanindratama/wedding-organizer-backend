import { Request, Response } from "express";
import { prisma } from "@/db/prisma.js";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

type SortKey =
  | "newest"
  | "oldest"
  | "event_asc"
  | "event_desc"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

function buildOrderBy(sort?: SortKey) {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "event_asc") return { eventDate: "asc" as const };
  if (sort === "event_desc") return { eventDate: "desc" as const };
  if (sort === "price_asc") return { totalPrice: "asc" as const };
  if (sort === "price_desc") return { totalPrice: "desc" as const };
  if (sort === "name_asc") return { customerName: "asc" as const };
  if (sort === "name_desc") return { customerName: "desc" as const };
  return { createdAt: "desc" as const };
}

function parsePageLimit(req: Request) {
  const page = Math.max(1, Math.floor(Number(req.query.page ?? 1)));
  const limitRaw = Math.floor(Number(req.query.limit ?? 10));
  const limit = Math.min(
    100,
    Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 10)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildWhere(req: Request) {
  const {
    q,
    status,
    packageId,
    userId,
    dateFrom,
    dateTo,
    minPrice,
    maxPrice,
    code,
    email,
  } = req.query as {
    q?: string;
    status?: string;
    packageId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    minPrice?: string;
    maxPrice?: string;
    code?: string;
    email?: string;
  };

  const where: Prisma.OrderWhereInput = {};

  if (code) where.orderCode = code as string;
  if (email) where.customerEmail = email as string;
  if (status) where.status = status as any;
  if (packageId) where.packageId = packageId as string;
  if (userId) where.userId = userId as string;

  if (dateFrom || dateTo) {
    where.eventDate = {};
    if (dateFrom) (where.eventDate as any).gte = new Date(dateFrom);
    if (dateTo) (where.eventDate as any).lte = new Date(dateTo);
  }

  if (minPrice || maxPrice) {
    where.totalPrice = {};
    if (minPrice) (where.totalPrice as any).gte = Number(minPrice);
    if (maxPrice) (where.totalPrice as any).lte = Number(maxPrice);
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

export async function createOrder(req: Request, res: Response) {
  const {
    packageId,
    customerName,
    customerEmail,
    customerPhone,
    eventDate,
    venue,
    notes,
  } = req.body as any;

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

export async function checkOrder(req: Request, res: Response) {
  const { code, email } = req.query as { code?: string; email?: string };
  if (!code && !email) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ status: "fail", message: "Provide code or email" });
  }

  const { page, limit, skip } = parsePageLimit(req);
  const sort = (req.query.sort as SortKey) || "newest";
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

export async function listOrders(req: Request, res: Response) {
  const { page, limit, skip } = parsePageLimit(req);
  const sort = req.query.sort as SortKey | undefined;
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

export async function updateOrderStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as {
    status: "PENDING" | "APPROVED" | "REJECTED";
  };
  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: { package: true, user: true },
  });
  return res.json({ status: "success", data: updated });
}
