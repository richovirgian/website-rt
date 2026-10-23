import { cn } from "@/lib/utils";

const NADA = {
  hijau: "border-hijau/30 bg-hijau/10 text-hijau",
  jingga: "border-amber-700/30 bg-jingga/15 text-amber-900",
  abu: "border-line-strong bg-krem-2 text-muted-fg",
  merah: "border-red-700/30 bg-red-50 text-red-800",
} as const;

export function Lencana({
  nada = "abu",
  children,
}: {
  nada?: keyof typeof NADA;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        NADA[nada],
      )}
    >
      {children}
    </span>
  );
}
