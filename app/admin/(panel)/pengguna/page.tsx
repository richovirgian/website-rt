import type { Metadata } from "next";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { PanelPengguna } from "@/components/cms/panel-pengguna";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pengguna",
};

export default async function HalamanPengguna() {
  const s = await wajibIzin("users.manage");

  const daftar = await db().user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return <PanelPengguna daftar={daftar} sesiUserId={s.user.id} />;
}
