import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getRequiredEnv } from "./env.ts";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: "root",
  password: getRequiredEnv("DATABASE_PASSWORD"),
  database: "university_system",
});

export const prisma = new PrismaClient({ adapter });
