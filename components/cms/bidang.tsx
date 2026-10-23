import { cn } from "@/lib/utils";

/**
 * Pembungkus satu isian: label, kontrol, bantuan, dan pesan galat.
 * Pesan galat tampil menggantikan bantuan dan dihubungkan lewat
 * aria-describedby oleh pemanggil (`${id}-info`).
 */
export function Bidang({
  id,
  label,
  wajib = false,
  bantuan,
  galat,
  className,
  children,
}: {
  id: string;
  label: string;
  wajib?: boolean;
  bantuan?: string;
  galat?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-hijau-tua">
        {label}
        {wajib && (
          <span aria-hidden="true" className="ml-0.5 text-red-700">
            *
          </span>
        )}
      </label>
      {children}
      <p
        id={`${id}-info`}
        className={cn("text-xs", galat ? "text-red-700" : "text-muted-fg")}
        role={galat ? "alert" : undefined}
      >
        {galat ?? bantuan ?? ""}
      </p>
    </div>
  );
}
