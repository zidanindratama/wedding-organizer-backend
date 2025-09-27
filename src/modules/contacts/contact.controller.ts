import { Request, Response } from "express";
import { prisma } from "@/db/prisma.js";
import { StatusCodes } from "http-status-codes";

type SortKey =
  | "newest"
  | "oldest"
  | "name_asc"
  | "name_desc"
  | "email_asc"
  | "email_desc";

function buildOrderBy(sort?: SortKey) {
  if (sort === "oldest") return { createdAt: "asc" as const };
  if (sort === "name_asc") return { name: "asc" as const };
  if (sort === "name_desc") return { name: "desc" as const };
  if (sort === "email_asc") return { email: "asc" as const };
  if (sort === "email_desc") return { email: "desc" as const };
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
  const { q, status } = req.query as { q?: string; status?: string };
  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export async function createContact(req: Request, res: Response) {
  const { name, email, message } = req.body as any;
  const created = await prisma.contact.create({
    data: { name, email, message, status: "NEW" },
  });
  return res
    .status(StatusCodes.CREATED)
    .json({ status: "success", data: created });
}

export async function listContacts(req: Request, res: Response) {
  const sort = req.query.sort as SortKey | undefined;
  const orderBy = buildOrderBy(sort);
  const { page, limit, skip } = parsePageLimit(req);
  const where = buildWhere(req);

  const [total, data] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({ where, orderBy, skip, take: limit }),
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

export async function updateContactStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status } = req.body as { status: "NEW" | "READ" };
  const updated = await prisma.contact.update({
    where: { id },
    data: { status },
  });
  return res.json({ status: "success", data: updated });
}
