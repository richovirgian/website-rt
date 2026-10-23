import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

/**
 * Titik masuk Better Auth.
 *
 * Instance-nya dipanggil di dalam handler, bukan di tingkat modul: `next build`
 * mengimpor route ini untuk mengumpulkan data halaman, dan di dalam container
 * belum ada DATABASE_URL maupun BETTER_AUTH_SECRET.
 */
export const POST = async (req: Request) => toNextJsHandler(auth()).POST(req);
export const GET = async (req: Request) => toNextJsHandler(auth()).GET(req);
