"use client";

import React from "react";
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
  if (selectedCars.length === 0) return null;

  interface SpecsRow {
    label: string;
    value: (car: Car) => string;
  }

  const specsRows: readonly SpecsRow[] = [
    {
      label: "Price (Ex-Showroom)",
      value: (car) => `${formatINR(car.price)} (${formatINRFull(car.price)})`,
    },
    { label: "Propulsion", value: (car) => car.fuelType },
    { label: "Structure", value: (car) => car.type },
    {
      label: "Model Year",
      value: (car) => (car.year ? String(car.year) : "Not listed"),
    },
    {
      label: "Engine displacement",
      value: (car) =>
        car.datasetSpecs.engineCc
          ? `${car.datasetSpecs.engineCc} cc`
          : "Not listed",
    },
    { label: "Power output", value: (car) => car.specs.power },
    {
      label: "Torque",
      value: (car) =>
        car.datasetSpecs.torque
          ? `${car.datasetSpecs.torque} Nm`
          : "Not listed",
    },
    {
      label: "Transmission",
      value: (car) => car.datasetSpecs.transmission || "Not listed",
    },
    {
      label: "Combined mileage",
      value: (car) =>
        car.datasetSpecs.mileageCombined
          ? `${car.datasetSpecs.mileageCombined} km/l`
          : car.specs.rangeOrMpg,
    },
    {
      label: "Fuel tank capacity",
      value: (car) =>
        car.datasetSpecs.fuelTankCapacity
          ? `${car.datasetSpecs.fuelTankCapacity} L`
          : "Not listed",
    },
    {
      label: "Seating capacity",
      value: (car) =>
        car.datasetSpecs.seatingCapacity
          ? `${car.datasetSpecs.seatingCapacity} seats`
          : "Not listed",
    },
    { label: "Cargo volume", value: (car) => car.specs.cargoSpace },
    {
      label: "Ground clearance",
      value: (car) =>
        car.datasetSpecs.groundClearance
          ? `${car.datasetSpecs.groundClearance} mm`
          : "Not listed",
    },
    {
      label: "Safety rating",
      value: (car) =>
        car.datasetSpecs.safetyRating
          ? `${car.datasetSpecs.safetyRating} / 5`
          : "Not listed",
    },
    {
      label: "Airbags",
      value: (car) =>
        car.datasetSpecs.airbagsCount
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-ivory-bg border border-ivory-border rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(40,30,20,0.15)] flex flex-col max-h-[90vh]">
        {/* Header telemetry bar */}
        <div className="p-6 md:p-8 border-b border-ivory-border flex justify-between items-center bg-white">
          <div>
            <span className="font-serif italic text-brand text-xs font-semibold tracking-wider block">
              Diagnostic Comparison
            </span>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground mt-1">
              Vehicle Spec Matrix ({selectedCars.length} / 3)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs py-2 px-5 rounded-full border border-ivory-border text-foreground hover:bg-ivory-hover transition-all cursor-pointer"
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
                        [Slot {selectedCars.length + idx + 1} Empty]
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Mechanical Specifications */}
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 font-bold text-brand uppercase font-mono text-[9px] tracking-wider border-b border-ivory-border pt-6"
                  >
                    ENGINEERING & PHYSICAL SPECS
                  </td>
                </tr>
                {specsRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-ivory-border/60 hover:bg-ivory-hover/30"
                  >
                    <td className="py-3.5 pr-4 text-ivory-text-muted">
                      {row.label}
                    </td>
                    {selectedCars.map((car) => (
                      <td
                        key={car.id}
                        className="py-3.5 px-4 font-bold text-foreground font-serif italic"
                      >
                        {row.value(car)}
                      </td>
                    ))}
                    {Array.from({ length: 3 - selectedCars.length }).map(
                      (_, idx) => (
                        <td key={idx} className="py-3.5 px-4 text-ivory-border">
                          —
                        </td>
                      ),
                    )}
                  </tr>
                ))}

                {/* Performance Metrics */}
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 font-bold text-brand uppercase font-mono text-[9px] tracking-wider border-b border-ivory-border pt-6"
                  >
                    CALIBRATED SCORE CARD (1 - 10)
                  </td>
                </tr>
                {metricRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-ivory-border/60 hover:bg-ivory-hover/30"
                  >
                    <td className="py-3.5 pr-4 text-ivory-text-muted">
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
    </div>
  );
}
