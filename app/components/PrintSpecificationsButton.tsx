"use client";

export default function PrintSpecificationsButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-ivory-border bg-white px-3 py-2 font-mono text-[9px] font-semibold uppercase tracking-wider text-foreground transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      Print specifications
    </button>
  );
}
