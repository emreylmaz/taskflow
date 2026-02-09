/**
 * Seed Script — Development verisi oluşturur
 * Çalıştırma: npx prisma db seed
 */

import { PrismaClient, Role, Priority } from "@prisma/client";
import { hashPassword } from "../src/utils/hash.js";

const prisma = new PrismaClient();

// Default listeler her proje için oluşturulacak
const DEFAULT_LISTS = [
  { name: "To Do", position: 0, color: "#6B7280" }, // Gray
  { name: "In Progress", position: 1, color: "#3B82F6" }, // Blue
  { name: "Done", position: 2, color: "#10B981" }, // Green
  { name: "Archive", position: 999, color: "#9CA3AF", isArchive: true },
];

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Test Users ──────────────────────────────────────────
  console.log("Creating users...");

  const password = await hashPassword("Test1234!");

  const user1 = await prisma.user.upsert({
    where: { email: "emre@example.com" },
    update: {},
    create: {
      email: "emre@example.com",
      name: "Emre Yılmaz",
      password,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      password,
    },
  });

  console.log(`  ✓ ${user1.name} (${user1.email})`);
  console.log(`  ✓ ${user2.name} (${user2.email})\n`);

  // ── Demo Project ────────────────────────────────────────
  console.log("Creating demo project...");

  // Önce mevcut projeyi temizle (idempotent seed için)
  await prisma.project.deleteMany({
    where: { name: "TaskFlow Demo" },
  });

  const project = await prisma.project.create({
    data: {
      name: "TaskFlow Demo",
      description: "TaskFlow demo projesi - özellikler burada test edilebilir.",
      color: "#6366f1",
      modules: {
        flow_control: false,
        subtasks: false,
        time_tracking: false,
        webhooks: false,
        ai_features: false,
      },
      members: {
        create: [
          { userId: user1.id, role: Role.OWNER },
          { userId: user2.id, role: Role.MEMBER },
        ],
      },
      lists: {
        create: DEFAULT_LISTS.map((list) => ({
          name: list.name,
          position: list.position,
          color: list.color,
          isArchive: list.isArchive ?? false,
        })),
      },
      labels: {
        create: [
          { name: "bug", color: "#EF4444" }, // Red
          { name: "feature", color: "#8B5CF6" }, // Purple
          { name: "enhancement", color: "#3B82F6" }, // Blue
          { name: "documentation", color: "#10B981" }, // Green
          { name: "urgent", color: "#F59E0B" }, // Amber
        ],
      },
    },
    include: {
      lists: true,
      labels: true,
    },
  });

  console.log(`  ✓ Project: ${project.name}`);
  console.log(`  ✓ Lists: ${project.lists.map((l) => l.name).join(", ")}`);
  console.log(`  ✓ Labels: ${project.labels.map((l) => l.name).join(", ")}\n`);

  // ── Sample Tasks ────────────────────────────────────────
  console.log("Creating sample tasks...");

  const todoList = project.lists.find((l) => l.name === "To Do")!;
  const inProgressList = project.lists.find((l) => l.name === "In Progress")!;
  const doneList = project.lists.find((l) => l.name === "Done")!;

  const bugLabel = project.labels.find((l) => l.name === "bug")!;
  const featureLabel = project.labels.find((l) => l.name === "feature")!;
  const urgentLabel = project.labels.find((l) => l.name === "urgent")!;

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Drag & Drop implementasyonu",
        description:
          "Task kartlarının liste içinde ve listeler arasında sürüklenebilmesi.",
        priority: Priority.HIGH,
        position: 0,
        projectId: project.id,
        listId: todoList.id,
        assigneeId: user1.id,
        labels: {
          create: [{ labelId: featureLabel.id }],
        },
      },
    }),
    prisma.task.create({
      data: {
        title: "Flow control özelliği",
        description: "Listelere role-based giriş/çıkış kısıtlamaları ekle.",
        priority: Priority.MEDIUM,
        position: 1,
        projectId: project.id,
        listId: todoList.id,
        labels: {
          create: [{ labelId: featureLabel.id }],
        },
      },
    }),
    prisma.task.create({
      data: {
        title: "Login sayfası bug düzeltme",
        description:
          "Hatalı şifre girildiğinde hata mesajı düzgün gösterilmiyor.",
        priority: Priority.URGENT,
        position: 0,
        projectId: project.id,
        listId: inProgressList.id,
        assigneeId: user1.id,
        labels: {
          create: [{ labelId: bugLabel.id }, { labelId: urgentLabel.id }],
        },
      },
    }),
    prisma.task.create({
      data: {
        title: "API documentation",
        description: "OpenAPI/Swagger ile API dokümantasyonu oluştur.",
        priority: Priority.LOW,
        position: 1,
        projectId: project.id,
        listId: inProgressList.id,
        assigneeId: user2.id,
      },
    }),
    prisma.task.create({
      data: {
        title: "Auth sistemi",
        description: "JWT tabanlı authentication ve refresh token rotation.",
        priority: Priority.HIGH,
        position: 0,
        projectId: project.id,
        listId: doneList.id,
        assigneeId: user1.id,
      },
    }),
  ]);

  console.log(`  ✓ Created ${tasks.length} tasks\n`);

  console.log("✅ Seed completed!");
  console.log("\nTest credentials:");
  console.log("  Email: emre@example.com");
  console.log("  Password: Test1234!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
