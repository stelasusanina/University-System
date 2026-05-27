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

try {
  // ── Faculty ──────────────────────────────────────────────
  const faculty = await prisma.faculty.upsert({
    where: { code: "FKSU" },
    update: {},
    create: {
      name: "Факултет по компютърни системи и управление",
      code: "FKSU",
      description: "Обучение по специалности в областта на компютърните системи, мрежи и автоматизация.",
    },
  });
  console.log(`Faculty: ${faculty.name}`);

  // ── Specialty ─────────────────────────────────────────────
  const specialty = await prisma.specialty.upsert({
    where: { code: "KST" },
    update: {},
    create: {
      name: "Компютърни системи и технологии",
      code: "KST",
      degree: "BACHELOR",
      years: 4,
      facultyId: faculty.id,
    },
  });
  console.log(`Specialty: ${specialty.name}`);

  // ── Academic Staff ────────────────────────────────────────
  const staff1 = await prisma.academicStaff.upsert({
    where: { staffNumber: "ST001" },
    update: {},
    create: {
      staffNumber: "ST001",
      firstName: "Иван",
      lastName: "Петров",
      phone: "0888000001",
      title: "PROFESSOR",
      facultyId: faculty.id,
    },
  });

  const staff2 = await prisma.academicStaff.upsert({
    where: { staffNumber: "ST002" },
    update: {},
    create: {
      staffNumber: "ST002",
      firstName: "Мария",
      lastName: "Георгиева",
      phone: "0888000002",
      title: "ASSOCIATE_PROFESSOR",
      facultyId: faculty.id,
    },
  });

  const staff3 = await prisma.academicStaff.upsert({
    where: { staffNumber: "ST003" },
    update: {},
    create: {
      staffNumber: "ST003",
      firstName: "Георги",
      lastName: "Димитров",
      phone: "0888000003",
      title: "ASSISTANT",
      facultyId: faculty.id,
    },
  });
  console.log(`Academic staff: ${staff1.lastName}, ${staff2.lastName}, ${staff3.lastName}`);

  // ── Students ──────────────────────────────────────────────
  const student1 = await prisma.student.upsert({
    where: { facultyNumber: "221200001" },
    update: {},
    create: {
      facultyNumber: "221200001",
      firstName: "Александър",
      lastName: "Иванов",
      phone: "0899000001",
      year: 1,
      group: 1,
      status: "ACTIVE",
      specialtyId: specialty.id,
    },
  });

  const student2 = await prisma.student.upsert({
    where: { facultyNumber: "221200002" },
    update: {},
    create: {
      facultyNumber: "221200002",
      firstName: "Симона",
      lastName: "Николова",
      phone: "0899000002",
      year: 1,
      group: 1,
      status: "ACTIVE",
      specialtyId: specialty.id,
    },
  });

  const student3 = await prisma.student.upsert({
    where: { facultyNumber: "221200003" },
    update: {},
    create: {
      facultyNumber: "221200003",
      firstName: "Никола",
      lastName: "Стоянов",
      phone: "0899000003",
      year: 1,
      group: 1,
      status: "ACTIVE",
      specialtyId: specialty.id,
    },
  });
  console.log(`Students: ${student1.lastName}, ${student2.lastName}, ${student3.lastName}`);

  // ── Semester ──────────────────────────────────────────────
  const semester = await prisma.semester.upsert({
    where: { id: 1 },
    update: { isCurrent: true },
    create: {
      name: "Зимен семестър 2025/2026",
      year: 2025,
      period: "WINTER",
      startDate: new Date("2025-10-01"),
      endDate: new Date("2026-01-31"),
      isCurrent: true,
    },
  });
  console.log(`Semester: ${semester.name}`);

  // ── Courses ───────────────────────────────────────────────
  const course1 = await prisma.course.upsert({
    where: { code: "PF101" },
    update: {},
    create: {
      name: "Програмиране – основи",
      code: "PF101",
      description: "Въведение в програмирането с C++.",
      credits: 6,
      year: 1,
      semester: 1,
      type: "MANDATORY",
      specialtyId: specialty.id,
      academicStaffId: staff1.id,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: "DIS101" },
    update: {},
    create: {
      name: "Дискретна математика",
      code: "DIS101",
      description: "Логика, множества, графи и комбинаторика.",
      credits: 5,
      year: 1,
      semester: 1,
      type: "MANDATORY",
      specialtyId: specialty.id,
      academicStaffId: staff2.id,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { code: "ENG101" },
    update: {},
    create: {
      name: "Английски език – ниво 1",
      code: "ENG101",
      description: "Академичен английски за технически специалности.",
      credits: 3,
      year: 1,
      semester: 1,
      type: "MANDATORY",
      specialtyId: specialty.id,
      academicStaffId: staff3.id,
    },
  });
  console.log(`Courses: ${course1.code}, ${course2.code}, ${course3.code}`);

  // ── Enrollments ───────────────────────────────────────────
  for (const student of [student1, student2, student3]) {
    for (const course of [course1, course2, course3]) {
      await prisma.enrollment.upsert({
        where: {
          studentId_courseId_semesterId: {
            studentId: student.id,
            courseId: course.id,
            semesterId: semester.id,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          status: "ЗАПИСАН",
        },
      });
    }
  }
  console.log("Enrollments: 9 created (3 students × 3 courses)");

  // ── Schedules ─────────────────────────────────────────────
  await prisma.schedule.upsert({
    where: { id: 1 },
    update: {},
    create: {
      courseId: course1.id,
      academicStaffId: staff1.id,
      semesterId: semester.id,
      dayOfWeek: "ПОНЕДЕЛНИК",
      startTime: "08:00",
      endTime: "10:00",
      room: "1303",
      type: "ЛЕКЦИЯ",
    },
  });

  await prisma.schedule.upsert({
    where: { id: 2 },
    update: {},
    create: {
      courseId: course1.id,
      academicStaffId: staff1.id,
      semesterId: semester.id,
      dayOfWeek: "СРЯДА",
      startTime: "10:00",
      endTime: "12:00",
      room: "1404",
      type: "СЕМИНАРНО_УПРАЖНЕНИЕ",
    },
  });

  await prisma.schedule.upsert({
    where: { id: 3 },
    update: {},
    create: {
      courseId: course2.id,
      academicStaffId: staff2.id,
      semesterId: semester.id,
      dayOfWeek: "ВТОРНИК",
      startTime: "12:00",
      endTime: "14:00",
      room: "2205",
      type: "ЛЕКЦИЯ",
    },
  });

  await prisma.schedule.upsert({
    where: { id: 4 },
    update: {},
    create: {
      courseId: course3.id,
      academicStaffId: staff3.id,
      semesterId: semester.id,
      dayOfWeek: "ЧЕТВЪРТЪК",
      startTime: "14:00",
      endTime: "16:00",
      room: "13102",
      type: "ЛЕКЦИЯ",
    },
  });
  console.log("Schedules: 4 entries created");

  // ── Channels ──────────────────────────────────────────────
  await prisma.channel.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "PF101 – Общ канал",
      description: "Съобщения и материали по Програмиране – основи.",
      courseId: course1.id,
      academicStaffId: staff1.id,
    },
  });

  await prisma.channel.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: "DIS101 – Общ канал",
      description: "Дискретна математика – въпроси и дискусии.",
      courseId: course2.id,
      academicStaffId: staff2.id,
    },
  });
  console.log("Channels: 2 created");

  // ── Announcements ─────────────────────────────────────────
  await prisma.announcement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      message: "Упражнението по Програмиране на 15.11 се провежда в зала 1404 вместо 1303.",
      type: "СМЯНА_НА_ЗАЛА",
      validTo: new Date("2025-11-15"),
      academicStaffId: staff1.id,
      courseId: course1.id,
      specialtyId: specialty.id,
      year: 1,
      group: 1,
      semesterId: semester.id,
    },
  });

  await prisma.announcement.upsert({
    where: { id: 2 },
    update: {},
    create: {
      message: "Консултации по Дискретна математика всяка сряда от 10:00 до 12:00 в каб. 2301.",
      type: "ИНФОРМАЦИЯ",
      validTo: new Date("2026-01-31"),
      academicStaffId: staff2.id,
      courseId: course2.id,
      specialtyId: specialty.id,
      year: 1,
      semesterId: semester.id,
    },
  });

  await prisma.announcement.upsert({
    where: { id: 3 },
    update: {},
    create: {
      message: "Контролно по Програмиране – основи на 20.11 от 08:00 в зала 1303. Носете лична карта.",
      type: "СПЕШНО",
      validTo: new Date("2025-11-20"),
      academicStaffId: staff1.id,
      courseId: course1.id,
      specialtyId: specialty.id,
      year: 1,
      group: 1,
      semesterId: semester.id,
    },
  });
  console.log("Announcements: 3 created");

  // ── Events ────────────────────────────────────────────────
  await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Контролно 1 – Програмиране основи",
      type: "КОНТРОЛНА",
      date: new Date("2025-11-20"),
      startTime: "08:00",
      endTime: "10:00",
      room: "1303",
      courseId: course1.id,
      academicStaffId: staff1.id,
      specialtyId: specialty.id,
      year: 1,
      group: 1,
      semesterId: semester.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: "Изпит – Дискретна математика",
      type: "ИЗПИТ",
      date: new Date("2026-01-28"),
      startTime: "10:00",
      endTime: "13:00",
      room: "2205",
      courseId: course2.id,
      academicStaffId: staff2.id,
      specialtyId: specialty.id,
      year: 1,
      semesterId: semester.id,
    },
  });

  await prisma.event.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: "Курсов проект – Програмиране основи",
      type: "ЗАЩИТА_НА_ПРОЕКТ",
      date: new Date("2026-01-15"),
      startTime: "14:00",
      endTime: "16:00",
      room: "1404",
      courseId: course1.id,
      academicStaffId: staff1.id,
      specialtyId: specialty.id,
      year: 1,
      group: 1,
      semesterId: semester.id,
    },
  });
  console.log("Events: 3 created");

  console.log("\n✓ Seed completed successfully.");
} catch (err) {
  console.error(err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
