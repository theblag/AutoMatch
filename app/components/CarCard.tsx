"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Car, UserPreferences, formatINR, formatINRFull } from "../data";
import RadarMetric from "./RadarMetric";

interface CarCardProps {
  car: Car;
  matchPercentage: number;
  userMetrics?: UserPreferences["metrics"];
  isCompared: boolean;
  onCompareToggle: () => void;
  compareCount: number;
}

export default function CarCard({
  car,
  matchPercentage,
  userMetrics,
  isCompared,
  onCompareToggle,
  compareCount,
}: CarCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // SVG Silhouettes representing different body styles (Refined Sketch Style)
  const renderSilhouette = (type: Car["type"]) => {
    const strokeColor = "#706a62";
    const wheelFill = "#fcfbfa";
    const groundColor = "#e8e2dc";

    switch (type) {
      case "SUV":
        return (
          <svg
            viewBox="0 0 120 40"
            className="w-full h-12 stroke-[1.2] fill-none"
            style={{ stroke: strokeColor }}
          >
            <path d="M5 28 L15 28 C18 28, 20 25, 22 20 L27 12 C29 9, 32 8, 38 8 L75 8 C80 8, 83 10, 86 14 L95 20 C99 22, 102 24, 110 24 L115 24 L115 28 L110 28" />
            <circle
              cx="28"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="92"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="28"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <circle
              cx="92"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <line
              x1="0"
              y1="36"
              x2="120"
              y2="36"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
          </svg>
        );
      case "MUV":
        return (
          <svg
            viewBox="0 0 120 40"
            className="w-full h-12 stroke-[1.2] fill-none"
            style={{ stroke: strokeColor }}
          >
            <path d="M5 28 L14 28 C18 28, 20 24, 23 17 L27 10 C29 7, 33 6, 39 6 L76 6 C83 6, 87 9, 90 14 L96 22 C99 25, 103 26, 110 26 L115 26 L115 28" />
            <line
              x1="42"
              y1="7"
              x2="42"
              y2="22"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
            <line
              x1="67"
              y1="7"
              x2="67"
              y2="22"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
            <circle
              cx="28"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="92"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="28"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <circle
              cx="92"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <line
              x1="0"
              y1="36"
              x2="120"
              y2="36"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
          </svg>
        );
      case "Sedan":
        return (
          <svg
            viewBox="0 0 120 40"
            className="w-full h-12 stroke-[1.2] fill-none"
            style={{ stroke: strokeColor }}
          >
            <path d="M5 28 L15 28 C18 28, 20 26, 22 23 L28 17 C31 13, 34 12, 40 12 L72 12 C77 12, 80 14, 82 17 L88 23 C90 26, 92 27, 98 27 L110 27 L115 27 L115 28" />
            <circle
              cx="28"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="92"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="28"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <circle
              cx="92"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <line
              x1="0"
              y1="36"
              x2="120"
              y2="36"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
          </svg>
        );
      case "Coupe":
        return (
          <svg
            viewBox="0 0 120 40"
            className="w-full h-12 stroke-[1.2] fill-none"
            style={{ stroke: strokeColor }}
          >
            <path d="M5 28 L15 28 C18 28, 21 26, 23 23 L32 15 C35 12, 39 11, 44 11 L68 11 C74 11, 78 13, 81 18 L87 23 C89 26, 91 27, 97 27 L110 27 L115 27" />
            <circle
              cx="28"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="92"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="28"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <circle
              cx="92"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <line
              x1="0"
              y1="36"
              x2="120"
              y2="36"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
          </svg>
        );
      case "Truck":
        return (
          <svg
            viewBox="0 0 120 40"
            className="w-full h-12 stroke-[1.2] fill-none"
            style={{ stroke: strokeColor }}
          >
            <path d="M5 28 L12 28 C15 28, 17 25, 19 20 L24 12 C26 9, 29 8, 35 8 L65 8 L65 24 L110 24 L115 24 L115 28" />
            <line
              x1="65"
              y1="8"
              x2="65"
              y2="24"
              className="stroke-[0.75]"
              style={{ stroke: groundColor, strokeDasharray: "2,2" }}
            />
            <circle
              cx="26"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="92"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="26"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <circle
              cx="92"
              cy="28"
              r="2.5"
              className="fill-brand"
              style={{ stroke: "none" }}
            />
            <line
              x1="0"
              y1="36"
              x2="120"
              y2="36"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 120 40"
            className="w-full h-12 stroke-[1.2] fill-none"
            style={{ stroke: strokeColor }}
          >
            <path d="M5 28 L115 28" />
            <circle
              cx="28"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <circle
              cx="92"
              cy="28"
              r="8"
              className="stroke-[1.2]"
              style={{ fill: wheelFill }}
            />
            <line
              x1="0"
              y1="36"
              x2="120"
              y2="36"
              className="stroke-[0.75]"
              style={{ stroke: groundColor }}
            />
          </svg>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-ivory-border hover:border-brand/40 transition-all duration-300 overflow-hidden shadow-[0_10px_30px_rgba(220,210,195,0.12)] flex flex-col">
      {/* Header section with match indicator */}
      <div className="p-6 md:p-8 flex justify-between items-start gap-4 border-b border-ivory-border">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-[9px] text-brand border border-brand/35 bg-brand/5 px-2 py-0.5 rounded-full uppercase font-semibold">
              {car.fuelType} {"//"} {car.type}
            </span>
            <span className="font-serif italic text-xs text-ivory-text-muted">
              {car.variant
                ? `Variant ${car.variant}`
                : (car.year ?? "Variant specifications")}
            </span>
          </div>
          <Link
            href={`/cars/${car.id}`}
            className="group inline-block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            aria-label={`View full specifications for ${car.make} ${car.model} ${car.variant}`}
          >
            <h3 className="text-2xl md:text-3xl font-serif text-foreground font-semibold mt-2.5 tracking-tight group-hover:text-brand transition-colors">
              {car.make}{" "}
              <span className="text-brand font-normal italic font-serif">
                {car.model}
              </span>
            </h3>
          </Link>
          <p className="font-mono text-sm text-foreground font-bold mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <span>{formatINR(car.price)}</span>
            <span className="text-xs text-ivory-text-muted font-mono font-normal">
              ({formatINRFull(car.price)})
            </span>
            <span className="text-[10px] text-ivory-text-muted font-normal italic font-serif">
              EST. EX-SHOWROOM
            </span>
          </p>
        </div>

        {/* Circular Match Metric */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center h-16 w-16 rounded-full border border-ivory-border bg-ivory-hover">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-ivory-border fill-none"
                strokeWidth="2.5"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                className="stroke-brand fill-none"
                strokeWidth="2.5"
                strokeDasharray="175"
                strokeDashoffset={175 - (175 * matchPercentage) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="font-serif text-sm font-bold text-foreground italic">
              {matchPercentage}%
            </span>
          </div>
          <span className="font-mono text-[9px] text-brand font-semibold mt-1.5 tracking-wider uppercase">
            MATCH FIT
          </span>
        </div>
      </div>

      {/* Main stats layout */}
      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-5 gap-8 items-center flex-1">
        {/* Wireframe Silhouette depiction */}
        <div className="md:col-span-2 flex flex-col justify-between h-full space-y-4">
          <div className="bg-ivory-bg p-4 rounded-2xl border border-ivory-border/70 flex flex-col justify-center items-center h-28 relative">
            <div className="absolute top-2 left-3 font-serif italic text-[9px] text-ivory-text-muted">
              Technical Silhouette // Scan Lock
            </div>
            {renderSilhouette(car.type)}
          </div>

          {/* Dataset-backed quick specs */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-ivory-border">
              <span className="block text-[9px] text-ivory-text-muted font-mono uppercase">
                ENGINE
              </span>
              <span className="text-foreground font-serif italic font-bold">
                {car.datasetSpecs
                  ? `${car.datasetSpecs.engineCc} cc`
                  : car.specs.zeroToSixty}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-ivory-border">
              <span className="block text-[9px] text-ivory-text-muted font-mono uppercase">
                POWER
              </span>
              <span className="text-foreground font-serif italic font-bold">
                {car.specs.power}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-ivory-border">
              <span className="block text-[9px] text-ivory-text-muted font-mono uppercase">
                MILEAGE
              </span>
              <span className="text-foreground font-serif italic font-bold truncate block">
                {car.specs.rangeOrMpg}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-ivory-border">
              <span className="block text-[9px] text-ivory-text-muted font-mono uppercase">
                SEATS / CARGO
              </span>
              <span className="text-foreground font-serif italic font-bold truncate block">
                {car.datasetSpecs
                  ? `${car.datasetSpecs.seatingCapacity} / ${car.specs.cargoSpace}`
                  : car.specs.cargoSpace}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Radar Graphic */}
        <div className="md:col-span-3 flex justify-center">
          <RadarMetric
            metrics={car.metrics}
            userMetrics={userMetrics}
            size={170}
          />
        </div>
      </div>

      {/* Tagline / Subtitle */}
      <div className="px-8 py-3 bg-ivory-bg border-t border-b border-ivory-border">
        <p className="text-xs italic text-brand font-medium font-serif">
          &ldquo;{car.tagline}&rdquo;
        </p>
      </div>

      {/* Expandable Technical Details */}
      {isExpanded && (
        <div className="p-6 md:p-8 bg-ivory-bg border-t border-ivory-border space-y-5 text-xs">
          <div>
            <span className="font-serif italic text-xs text-brand block font-semibold mb-1">
              Curator Analysis
            </span>
            <p className="text-foreground/80 leading-relaxed font-serif">
              {car.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="font-serif text-[10px] text-brand block font-bold uppercase tracking-wider">
                COMPATIBILITY HIGHLIGHTS
              </span>
              <ul className="space-y-1 text-foreground/75 list-disc list-inside font-serif">
                {car.pros.map((pro, idx) => (
                  <li key={idx} className="leading-snug">
                    {pro}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-serif text-[10px] text-ivory-text-muted block font-bold uppercase tracking-wider">
                NOTABLE CONSIDERATIONS
              </span>
              <ul className="space-y-1 text-foreground/75 list-disc list-inside font-serif">
                {car.cons.map((con, idx) => (
                  <li key={idx} className="leading-snug">
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-ivory-border">
            <div>
              <span className="font-serif text-[10px] text-ivory-text-muted block font-bold uppercase tracking-wider mb-2">
                Optimal Use Cases
              </span>
              <div className="flex flex-wrap gap-1.5">
                {car.bestUseCases.map((use, idx) => (
                  <span
                    key={idx}
                    className="font-serif text-[10px] italic bg-ivory-hover text-foreground px-3 py-1 rounded-full border border-ivory-border"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="font-serif text-[10px] text-ivory-text-muted block font-bold uppercase tracking-wider mb-2">
                Key Standard Equipment
              </span>
              <div className="flex flex-wrap gap-1.5">
                {car.keyFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="font-serif text-[10px] italic bg-brand/5 text-brand border border-brand/20 px-3 py-1 rounded-full"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons Footer */}
      <div className="p-4 md:px-6 bg-white border-t border-ivory-border flex items-center justify-between mt-auto">
        <button
          onClick={onCompareToggle}
          className={`font-mono text-[9px] py-1.5 px-4 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer ${
            isCompared
              ? "border-brand bg-brand/5 text-brand font-bold"
              : "border-ivory-border text-ivory-text-muted hover:text-foreground hover:border-brand/40"
          }`}
        >
          {isCompared ? (
            <>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" />
              IN COMPARISON
            </>
          ) : (
            `ADD TO COMPARE (${compareCount}/3)`
          )}
        </button>

        <div className="flex items-center gap-4">
          <Link
            href={`/cars/${car.id}`}
            className="font-serif italic text-xs text-brand hover:text-brand-dark transition-all underline"
          >
            Full details
          </Link>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="font-serif italic text-xs text-brand hover:text-brand-dark transition-all underline cursor-pointer"
          >
            {isExpanded ? "Hide Specifications [-]" : "Quick view [+]"}
          </button>
        </div>
      </div>
    </div>
  );
}
