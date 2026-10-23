import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma Client tergenerate: bukan kode yang kita tulis, dan aturan gaya
    // kita tidak berlaku di sana. Dibangun ulang tiap `prisma generate`.
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
