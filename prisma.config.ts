// Muat .env.local dan .env secara native (Node.js 20.12+) tanpa dependensi pihak ketiga
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env.local");
  } catch {}
  try {
    process.loadEnvFile(".env");
  } catch {}
}
export default {
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/dummy_db?schema=public",
  },
};

