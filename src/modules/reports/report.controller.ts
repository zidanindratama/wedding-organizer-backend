import type { Request, Response } from "express";
import { prisma } from "@/db/prisma.js";

export async function ordersSummary(_req: Request, res: Response) {
  const [total, approved, pending, rejected] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "APPROVED" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "REJECTED" } }),
  ]);

  return res.json({
    status: "success",
    data: { total, approved, pending, rejected },
  });
}

export async function ordersCsv(_req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    include: { package: true },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "orderCode",
    "customerName",
    "customerEmail",
    "status",
    "package",
    "price",
    "createdAt",
  ].join(",");

  const rows = orders.map((o) =>
    [
      o.orderCode,
      JSON.stringify(o.customerName),
      o.customerEmail,
      o.status,
      JSON.stringify(o.package?.name || ""),
      o.totalPrice.toString(),
      o.createdAt.toISOString(),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=orders.csv");
  return res.send(csv);
}

export async function revenueSummary(_req: Request, res: Response) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const agg = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    _avg: { totalPrice: true },
    _count: true,
    where: {
      status: "APPROVED",
      createdAt: { gte: start, lte: now },
    },
  });

  return res.json({
    status: "success",
    data: {
      revenueThisMonth: agg._sum.totalPrice ?? 0,
      avgOrderValueThisMonth: agg._avg.totalPrice ?? 0,
      ordersThisMonth: agg._count,
    },
  });
}

export async function topPackages(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 3);

  const grouped = (await prisma.order.aggregateRaw({
    pipeline: [
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: "$packageId",
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { count: -1, revenue: -1 } },
      { $limit: limit },
      {
        $project: {
          packageId: { $toString: "$_id" },
          count: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ],
  })) as unknown as Array<{
    packageId: string;
    count: number;
    revenue: number;
  }>;

  if (!grouped.length) {
    return res.json({ status: "success", data: [] });
  }

  const ids = grouped.map((g) => g.packageId);
  const pkgs = await prisma.package.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });

  const nameById = new Map(pkgs.map((p) => [p.id, p.name]));

  const rows = grouped.map((g) => ({
    packageId: g.packageId,
    name: nameById.get(g.packageId) ?? null,
    count: g.count,
    revenue: g.revenue,
  }));

  return res.json({ status: "success", data: rows });
}

export async function upcomingEvents(req: Request, res: Response) {
  const days = Number(req.query.days ?? 30);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);

  const count = await prisma.order.count({
    where: {
      status: "APPROVED",
      eventDate: { gte: start, lte: end },
    },
  });

  return res.json({
    status: "success",
    data: { upcomingCount: count, rangeDays: days },
  });
}

export async function pendingAging(_req: Request, res: Response) {
  const oldest = await prisma.order.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true, orderCode: true },
  });

  const oldestPendingDays = oldest
    ? Math.max(
        0,
        Math.ceil(
          (Date.now() - oldest.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return res.json({
    status: "success",
    data: { oldestPendingDays, orderCode: oldest?.orderCode ?? null },
  });
}

export async function ordersTrend(req: Request, res: Response) {
  const days = Number(req.query.days ?? 30);
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = (await prisma.order.aggregateRaw({
    pipeline: [
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, revenue: 1, _id: 0 } },
    ],
  })) as unknown as Array<{ date: string; count: number; revenue: number }>;

  return res.json({ status: "success", data: rows });
}

export async function statusDistribution(_req: Request, res: Response) {
  const [approved, pending, rejected] = await Promise.all([
    prisma.order.count({ where: { status: "APPROVED" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "REJECTED" } }),
  ]);
  const total = approved + pending + rejected;

  return res.json({
    status: "success",
    data: { total, approved, pending, rejected },
  });
}
