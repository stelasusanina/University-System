import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.ts";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: "root",
  password: process.env.DATABASE_PASSWORD!,
  database: "university_system",
});

const prisma = new PrismaClient({ adapter });

const buildings = [
  {
    number: 1,
    name: "Технически университет – блок 1",
    address: 'Студентски Комплекс, ул. „проф. Георги Брадистилов“ 11, 1756 София',
    latitude: 42.6570438,
    longitude: 23.3553787,
  },
  {
    number: 2,
    name: "Технически университет – блок 2",
    address: 'Студентски Комплекс, ул. „проф. Георги Брадистилов“ 10, 1756 София',
    latitude: 42.6571201,
    longitude: 23.3544988,
  },
  {
    number: 3,
    name: "ТУ-София – Стопански факултет (блок 3)",
    address: 'Студентски Комплекс, ул. „Росарио“ 1, 1756 София',
    latitude: 42.6557818,
    longitude: 23.354924,
  },
  {
    number: 4,
    name: "ТУ-София – блок 4",
    address: 'Студентски Комплекс, ул. „Росарио“ 1, 1756 София',
    latitude: 42.6557818,
    longitude: 23.354924,
  },
  {
    number: 7,
    name: "УНИТе – блок 7 на ТУ-София",
    address: "Студентски Комплекс, 1756 София",
    latitude: 42.6552858,
    longitude: 23.3561177,
  },
  {
    number: 8,
    name: "Технически университет – блок 8",
    address: 'Студентски Комплекс, ул. „Росарио“ 1, 1756 София',
    latitude: 42.652731,
    longitude: 23.3540509,
  },
  {
    number: 10,
    name: "ТУ-София – блок 10 (ФаГИОПМ)",
    address: 'ж.к. Студентски град, бул. „Климент Охридски“ 8, Етаж 2, 1756 София',
    latitude: 42.6527147,
    longitude: 23.3547465,
  },
  {
    number: 12,
    name: "Технически университет – блок 12 (Електротехнически факултет)",
    address: 'Студентски Комплекс, ул. „проф. Георги Брадистилов“ 10, 1756 София',
    latitude: 42.6579453,
    longitude: 23.3533627,
  },
  {
    number: 13,
    name: "ТУ-София – блок 13 (Езиков център)",
    address: 'ж.к. Студентски град, ул. „Акад. Боян Петканчин“, 1700 София',
    latitude: 42.6502637,
    longitude: 23.3552017,
  },
];

try {
  for (const building of buildings) {
    await prisma.building.upsert({
      where: { number: building.number },
      update: building,
      create: building,
    });
    console.log(`Upserted building ${building.number}: ${building.name}`);
  }
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
