"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Car, formatINR, formatINRFull } from "../data";

interface CarComparisonProps {
  selectedCars: Car[];
  onRemove: (carId: string) => void;
  onClose: () => void;
}

export default function CarComparison({
  selectedCars,
  onRemove,
  onClose,
}: CarComparisonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted || selectedCars.length === 0) return null;

  interface SpecsRow {
    label: string;
    value: (car: Car) => string;
  }

  const specsRows: readonly SpecsRow[] = [
    {
      label: "Price (Ex-Showroom)",
      value: (car: Car) => `${formatINR(car.price)} (${formatINRFull(car.price)})`,
    },
    { label: "Propulsion", value: (car: Car) => car.fuelType },
    { label: "Structure", value: (car: Car) => car.type },
    {
      label: "Model Year",
      value: (car: Car) => (car.year ? String(car.year) : "Not listed"),
    },
    {
      label: "Engine displacement",
      value: (car: Car) =>
        car.datasetSpecs?.engineCc
          ? `${car.datasetSpecs.engineCc} cc`
          : "Not listed",
    },
    { label: "Power output", value: (car: Car) => car.specs.power || "Not listed" },
    {
      label: "Torque",
      value: (car: Car) =>
        car.datasetSpecs?.torque
          ? `${car.datasetSpecs.torque} Nm`
          : "Not listed",
    },
    {
      label: "Drive transmission",
      value: (car: Car) => car.datasetSpecs?.transmission || "Standard",
    },
    {
      label: "Efficiency rating",
      value: (car: Car) =>
        car.datasetSpecs?.mileageCombined
          ? `${car.datasetSpecs.mileageCombined} km/l`
          : car.specs.rangeOrMpg || "Not listed",
    },
    {
      label: "Fuel reservoir",
      value: (car: Car) =>
        car.datasetSpecs?.fuelTankCapacity
          ? `${car.datasetSpecs.fuelTankCapacity} Liters`
          : "Not listed",
    },
    {
      label: "Seating capacity",
      value: (car: Car) =>
        car.datasetSpecs?.seatingCapacity
          ? `${car.datasetSpecs.seatingCapacity} Passengers`
          : "Not listed",
    },
    {
      label: "Ground clearance",
      value: (car: Car) =>
        car.datasetSpecs?.groundClearance
          ? `${car.datasetSpecs.groundClearance} mm`
          : "Not listed",
    },
    {
      label: "Cargo volume",
      value: (car: Car) => car.specs.cargoSpace || "Not listed",
    },
    {
      label: "Safety rating",
      value: (car: Car) =>
        car.datasetSpecs?.safetyRating
          ? `${car.datasetSpecs.safetyRating} / 5 (Global NCAP)`
          : "Not rated",
    },
    {
      label: "Airbags",
      value: (car: Car) =>
        car.datasetSpecs?.airbagsCount
          ? String(car.datasetSpecs.airbagsCount)
          : "Not listed",
    },
  ];

  const metricRows = [
    { label: "Performance (Handling & Speed)", key: "performance" },
    { label: "Efficiency (Energy & Fuel)", key: "efficiency" },
    { label: "Utility (Space & Rigging)", key: "utility" },
    { label: "Comfort (Ride & Luxury)", key: "comfort" },
    { label: "Value (Purchase & Upkeep)", key: "value" },
  ] as const;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-matrix-title"
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-ivory-bg border border-ivory-border rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.35)] flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header telemetry bar */}
        <div className="p-6 md:p-8 border-b border-ivory-border flex justify-between items-center bg-white">
          <div>
            <span className="font-serif italic text-brand text-xs font-semibold tracking-wider block">
              Diagnostic Comparison
            </span>
            <h2
              id="comparison-matrix-title"
              className="text-xl md:text-2xl font-serif font-semibold text-foreground mt-1"
            >
              Vehicle Spec Matrix ({selectedCars.length} / 3)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono text-xs py-2 px-5 rounded-full border border-ivory-border text-foreground hover:bg-ivory-hover transition-all cursor-pointer font-bold"
          >
            CLOSE MATRIX [X]
          </button>
        </div>

        {/* Content Table Container */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6 bg-white">
          <div className="min-w-150 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-serif text-foreground/90">
              <thead>
                <tr className="border-b border-ivory-border">
                  <th className="py-4 pr-4 text-ivory-text-muted font-normal italic w-1/4">
                    Vehicle Attributes
                  </th>
                  {selectedCars.map((car) => (
                    <th key={car.id} className="py-4 px-4 w-1/4 relative">
                      <div className="space-y-1">
                        <div className="font-mono text-[9px] text-brand uppercase font-bold">
                          {car.make}
                        </div>
                        <div className="text-base font-bold text-foreground">
                          {car.model}
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemove(car.id)}
                          className="text-[10px] text-rose-600 hover:text-rose-500 underline cursor-pointer mt-1.5 block font-serif italic"
                        >
                          Remove [-]
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* Empty headers to fill up to 3 slots */}
                  {Array.from({ length: 3 - selectedCars.length }).map(
                    (_, idx) => (
                      <th
                        key={idx}
                        className="py-4 px-4 w-1/4 text-ivory-text-muted font-serif italic font-normal"
                      >
                        <div className="border border-dashed border-ivory-border rounded-xl p-4 text-center">
                          + Add car to slot
                        </div>
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-border/60">
                {/* Core Specifications */}
                {specsRows.map((row) => (
                  <tr key={row.label} className="hover:bg-ivory-bg/50">
                    <td className="py-3 pr-4 text-ivory-text-muted font-medium">
                      {row.label}
                    </td>
                    {selectedCars.map((car) => (
                      <td key={car.id} className="py-3 px-4">
                        {row.value(car)}
                      </td>
                    ))}
                    {Array.from({ length: 3 - selectedCars.length }).map(
                      (_, idx) => (
                        <td key={idx} className="py-3 px-4 text-ivory-border">
                          —
                        </td>
                      ),
                    )}
                  </tr>
                ))}

                {/* Algorithmic Dimension Metrics */}
                <tr className="bg-ivory-bg/80">
                  <td
                    colSpan={4}
                    className="py-2.5 px-4 font-mono text-[9px] uppercase tracking-wider text-brand font-bold"
                  >
                    Curated Algorithmic Vectors (Scale 1–10)
                  </td>
                </tr>

                {metricRows.map((row) => (
                  <tr key={row.label} className="hover:bg-ivory-bg/50">
                    <td className="py-3.5 pr-4 text-ivory-text-muted font-medium">
                      {row.label}
                    </td>
                    {selectedCars.map((car) => {
                      const score = car.metrics[row.key];
                      return (
                        <td key={car.id} className="py-3.5 px-4 font-bold">
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-foreground">{score}</span>
                            <div className="h-1.5 w-16 bg-[#e8e2dc] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand"
                                style={{ width: `${score * 10}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    {Array.from({ length: 3 - selectedCars.length }).map(
                      (_, idx) => (
                        <td key={idx} className="py-3.5 px-4 text-ivory-border">
                          —
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-5 bg-ivory-bg border-t border-ivory-border text-center">
          <p className="text-[10px] text-ivory-text-muted font-mono uppercase tracking-wider">
            Comparative metadata calculated through standard manufacturing
            testing procedures.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
