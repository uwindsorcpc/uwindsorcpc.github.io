/**
 * CPC UWindsor wordmark, built from text so it stays sharp at any size and
 * picks up the palette from globals.css.
 *
 *   horizontal:  <CPC/> │ UWindsor_     (navbar)
 *   stacked:     <CPC/>
 *                UWindsor_             (footer, large placements)
 *
 * The square favicon version lives in src/app/icon.svg.
 */
type LogoProps = {
  variant?: "horizontal" | "stacked";
  className?: string;
};

export function Logo({ variant = "horizontal", className = "" }: LogoProps) {
  const mark = (
    <span className="font-mono font-extrabold tracking-tight text-fg">
      <span className="text-accent">&lt;</span>CPC<span className="text-accent">/&gt;</span>
    </span>
  );

  const sub = (
    <span className="font-mono font-medium text-muted">
      UWindsor
      <span aria-hidden="true" className="cursor-blink text-accent">
        _
      </span>
    </span>
  );

  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col leading-none ${className}`}>
        <span className="text-3xl">{mark}</span>
        <span className="mt-1.5 text-sm">{sub}</span>
        <span className="sr-only">CPC UWindsor</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 leading-none ${className}`}>
      <span className="text-xl" aria-hidden="true">
        {mark}
      </span>
      <span aria-hidden="true" className="h-5 w-px bg-border" />
      <span className="text-sm" aria-hidden="true">
        {sub}
      </span>
      <span className="sr-only">CPC UWindsor</span>
    </span>
  );
}
