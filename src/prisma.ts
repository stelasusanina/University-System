import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

if (!process.env.DATABASE_PASSWORD) {
  throw new Error("Missing required environment variable: DATABASE_PASSWORD");
}

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: "root",
  password: process.env.DATABASE_PASSWORD,
  database: "university_system",
});

export const prisma = new PrismaClient({ adapter });
