import { cn } from "@/lib/utils";

/** Pembungkus section baku. */
export function Section({
  children,
  className,
  id,
  bordered = false,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  bordered?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 sm:py-28",
        // Jepit sumbu X: kartu ber-transform bisa melampaui lebar layar.
        // Memakai `clip`, bukan `hidden`, karena overflow hidden pada
        // leluhur akan mematikan position sticky di dalamnya.
        "[overflow-x:clip]",
        bordered && "border-t border-line",
        className,
      )}
    >
      <div className="shell">{children}</div>
    </section>
  );
}

/** Judul section: eyebrow + heading besar + deskripsi. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="text-[2.25rem] text-white sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h2>
      {description && <p className="lede">{description}</p>}
    </div>
  );
}

/** Dekorasi: garis grid vertikal tipis di latar section. */
export function GridLines({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 grid-lines opacity-60",
        className,
      )}
    />
  );
}

/** Dekorasi: glow teal radial. */
export function Glow({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full bg-brand/[0.10] blur-3xl",
        className,
      )}
    />
  );
}
