"use client";

import React, { useState } from "react";
import { getSpecificationDescription } from "@/lib/specificationGlossary";

interface SpecificationTooltipProps {
  specName: string;
  children?: React.ReactNode;
}

export default function SpecificationTooltip({
  specName,
  children,
}: SpecificationTooltipProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const description = getSpecificationDescription(specName);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 8,
      left: Math.max(8, rect.left - 100),
    });
    setIsHovering(true);
  };

  return (
    <div
      className="relative inline-flex items-center gap-2 group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main content */}
      <span>{children || specName}</span>

      {/* Info Icon */}
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand/10 text-brand text-[10px] font-bold cursor-help group-hover:bg-brand/20 transition-colors duration-200">
        ?
      </span>

      {/* Tooltip Box - Appears on hover */}
      {isHovering && (
        <div
          className="fixed z-[1000] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {/* Tooltip Container */}
          <div className="relative max-w-xs w-screen mx-2 md:w-auto">
            {/* Arrow pointing up to the icon */}
            <div
              className="absolute -top-1 left-[120px] w-2 h-2 bg-white border border-ivory-border rotate-45"
              style={{
                boxShadow: "-1px -1px 2px rgba(0,0,0,0.05)",
              }}
            />

            {/* Tooltip Content Box */}
            <div className="bg-white border border-ivory-border rounded-lg shadow-lg p-4 backdrop-blur-sm">
              {/* Title */}
              <h4 className="font-serif font-semibold text-sm text-foreground mb-2 leading-tight">
                {specName}
              </h4>

              {/* Description */}
              <p className="font-sans text-xs text-foreground/80 leading-relaxed">
                {description}
              </p>

              {/* Bottom accent line */}
              <div className="mt-3 h-0.5 bg-gradient-to-r from-brand/0 via-brand/30 to-brand/0 rounded-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
