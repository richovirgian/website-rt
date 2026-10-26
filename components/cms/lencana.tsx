import { cn } from "@/lib/utils";

const NADA = {
  hijau: "border-transparent bg-[#e6f0ec] text-[#1f5f4a]",
  jingga: "border-transparent bg-[#fdf0e3] text-[#9a4a0b]",
  abu: "border-transparent bg-[#f0efee] text-[#57534e]",
  merah: "border-transparent bg-[#fbeaea] text-[#9b1c1c]",
  biru: "border-transparent bg-[#eaf0fe] text-[#1e40af]",
} as const;

const TITIK: Record<keyof typeof NADA, string> = {
  hijau: "bg-[#2f855a]",
  jingga: "bg-[#e08a2e]",
  abu: "bg-[#a8a29e]",
  merah: "bg-[#dc2626]",
  biru: "bg-[#3b82f6]",
};

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
        "inline-flex items-center gap-1.5 rounded-full border py-1 pl-2 pr-2.5 text-[13px] font-medium",
        NADA[nada],
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", TITIK[nada])} />
      {children}
    </span>
  );
}
