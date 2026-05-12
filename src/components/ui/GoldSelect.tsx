"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function GoldSelect({ label, value, onChange, options }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? label;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full pl-3 pr-2.5 h-8 text-xs border transition-all"
        style={{ borderColor: "var(--gold)", color: "var(--gold)", backgroundColor: "#0A0A0A" }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown width={11} height={11} className="flex-shrink-0 opacity-70" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 rounded-xl border border-border bg-[#0A0A0A] shadow-xl py-1 min-w-full">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary transition-colors whitespace-nowrap"
              style={opt.value === value ? { color: "var(--gold)" } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
