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
    address: "Студентски Комплекс, ул. „проф. Георги Брадистилов“ 11, 1756 София",
    latitude: 42.6570438,
    longitude: 23.3553787,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8+%D1%83%D0%BD%D0%B8%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82/@42.6570477,23.3528038,17z",
  },
  {
    number: 2,
    name: "Технически университет – блок 2",
    address: "Студентски Комплекс, ул. „проф. Георги Брадистилов“ 10, 1756 София",
    latitude: 42.6571201,
    longitude: 23.3544988,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8+%D1%83%D0%BD%D0%B8%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82+-+%D0%B1%D0%BB%D0%BE%D0%BA+2/@42.6569432,23.3541146,18.5z",
  },
  {
    number: 3,
    name: "ТУ-София – Стопански факултет (блок 3)",
    address: "Студентски Комплекс, ул. „Росарио“ 1, 1756 София",
    latitude: 42.6557818,
    longitude: 23.354924,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%A3+-+%D0%A1%D0%BE%D1%84%D0%B8%D1%8F+%7C+%D0%A1%D1%82%D0%BE%D0%BF%D0%B0%D0%BD%D1%81%D0%BA%D0%B8+%D0%A4%D0%B0%D0%BA%D1%83%D0%BB%D1%82%D0%B5%D1%82/@42.6554349,23.3538445,18.5z",
  },
  {
    number: 4,
    name: "ТУ-София – блок 4",
    address: "Студентски Комплекс, ул. „Росарио“ 1, 1756 София",
    latitude: 42.6557818,
    longitude: 23.354924,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%A3+-+%D0%A1%D0%BE%D1%84%D0%B8%D1%8F+%7C+%D0%A1%D1%82%D0%BE%D0%BF%D0%B0%D0%BD%D1%81%D0%BA%D0%B8+%D0%A4%D0%B0%D0%BA%D1%83%D0%BB%D1%82%D0%B5%D1%82/@42.6554349,23.3538445,18.5z",
  },
  {
    number: 7,
    name: "УНИТе – блок 7 на ТУ-София",
    address: "Студентски Комплекс, 1756 София",
    latitude: 42.6552858,
    longitude: 23.3561177,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A3%D0%9D%D0%98%D0%A2%D0%B5+%2F%D0%91%D0%BB%D0%BE%D0%BA+7+%D0%BD%D0%B0+%D0%A2%D0%A3-%D0%A1%D0%BE%D1%84%D0%B8%D1%8F%2F/@42.6552858,23.3544777,18z",
  },
  {
    number: 8,
    name: "Технически университет – блок 8",
    address: "Студентски Комплекс, ул. „Росарио“ 1, 1756 София",
    latitude: 42.652731,
    longitude: 23.3540509,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8+%D1%83%D0%BD%D0%B8%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82+-+%D0%9D.+8+%D0%B1%D0%BB%D0%BE%D0%BA/@42.6527313,23.3532543,19z",
  },
  {
    number: 10,
    name: "ТУ-София – блок 10 (ФаГИОПМ)",
    address: "ж.к. Студентски град, бул. „Климент Охридски“ 8, Етаж 2, 1756 София",
    latitude: 42.6527147,
    longitude: 23.3547465,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%A3+-+%D0%A1%D0%BE%D1%84%D0%B8%D1%8F,+%D0%B1%D0%BB.+10+(%D0%A4%D0%B0%D0%93%D0%98%D0%9E%D0%9F%D0%9C)/@42.6527313,23.3532543,19z",
  },
  {
    number: 12,
    name: "Технически университет – блок 12 (Електротехнически факултет)",
    address: "Студентски Комплекс, ул. „проф. Георги Брадистилов“ 10, 1756 София",
    latitude: 42.6579453,
    longitude: 23.3533627,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%B5%D1%85%D0%BD%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%B8+%D0%A3%D0%BD%D0%B8%D0%B2%D0%B5%D1%80%D1%81%D0%B8%D1%82%D0%B5%D1%82+-+%D0%B1%D0%BB%D0%BE%D0%BA+12",
  },
  {
    number: 13,
    name: "ТУ-София – блок 13 (Езиков център)",
    address: "ж.к. Студентски град, ул. „Акад. Боян Петканчин“, 1700 София",
    latitude: 42.6502637,
    longitude: 23.3552017,
    googleMapsUrl:
      "https://www.google.com/maps/place/%D0%A2%D0%A3-%D0%A1%D0%BE%D1%84%D0%B8%D1%8F,+%D0%B1%D0%BB.+13",
  },
];

async function main() {
  for (const building of buildings) {
    await prisma.building.upsert({
      where: { number: building.number },
      update: building,
      create: building,
    });
    console.log(`Upserted building ${building.number}: ${building.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
