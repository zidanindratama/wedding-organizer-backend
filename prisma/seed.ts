import "dotenv/config";
import { prisma } from "../src/db/prisma.js";
import bcrypt from "bcryptjs";

/**
 * Seed data yang stabil (idempotent):
 * - Admin: dibuat jika belum ada (cek by email)
 * - Packages: upsert by `name` (butuh UNIQUE di schema.prisma)
 *
 * Catatan schema:
 * model Package {
 *   id        String   @id @default(cuid())
 *   name      String   @unique
 *   description String?
 *   price     Int
 *   isActive  Boolean  @default(true)
 *   imageUrl  String?
 *   createdAt DateTime @default(now())
 *   updatedAt DateTime @updatedAt
 * }
 */

const packagesData = [
  {
    name: "Silver Glam",
    description: "Paket simple dan elegan",
    price: 15_000_000,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1753711850283-d9ed2285be6d?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Gold Elegance",
    description: "Paket mewah dengan dekorasi premium",
    price: 30_000_000,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1565986438088-b7d99e8c8184?q=80&w=1738&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Platinum Luxury",
    description: "Paket eksklusif untuk pesta besar",
    price: 50_000_000,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1733244738988-70b1f4b96c37?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Rustic Garden",
    description: "Paket dengan konsep taman outdoor yang hangat",
    price: 20_000_000,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1724855946379-451f59d45df6?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    name: "Beach Wedding",
    description: "Paket pernikahan romantis di tepi pantai",
    price: 25_000_000,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1686853020993-e6284c6d93be?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL!;
  const name = process.env.SEED_ADMIN_NAME || "Admin";
  const rawPassword = process.env.SEED_ADMIN_PASSWORD!;

  if (!email || !rawPassword) {
    throw new Error(
      "Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD in environment."
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    console.log("Admin already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin seeded:", email);
}

async function seedPackages() {
  if (process.env.CLEAR_PACKAGES === "true") {
    await prisma.package.deleteMany();
    console.log("All packages cleared.");
  }

  const results = await Promise.all(
    packagesData.map((p) =>
      prisma.package.upsert({
        where: { name: p.name },
        update: {
          description: p.description,
          price: p.price,
          isActive: p.isActive,
          imageUrl: p.imageUrl,
        },
        create: p,
      })
    )
  );

  console.log(`Packages upserted: ${results.length}`);
}

async function main() {
  await seedAdmin();
  await seedPackages();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
