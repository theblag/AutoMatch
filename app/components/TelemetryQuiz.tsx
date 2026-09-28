"use client";

import React, { useState } from "react";
import {
  UserPreferences,
  formatINR,
  formatINRFull,
  BUDGET_STEP,
  fuelTypes,
  MAX_BUDGET,
  MIN_BUDGET,
  vehicleTypes,
} from "../data";

interface TelemetryQuizProps {
  onComplete: (prefs: UserPreferences) => void;
}

export default function TelemetryQuiz({ onComplete }: TelemetryQuizProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [budget, setBudget] = useState<number>(5500000);
  const [types, setTypes] = useState<string[]>([]);
  const [fuels, setFuels] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<UserPreferences["metrics"]>({
    performance: 5,
    efficiency: 5,
    utility: 5,
    value: 5,
    comfort: 5,
  });

  const toggleType = (type: string) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleFuel = (fuel: string) => {
    setFuels((prev) =>
      prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel],
    );
  };

  const updateMetric = (key: keyof UserPreferences["metrics"], val: number) => {
    setMetrics((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 2 | 3);
    } else {
      onComplete({
        budget,
        types,
        fuels,
        metrics,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-white p-10 rounded-3xl border border-ivory-border shadow-[0_15px_40px_rgba(205,195,180,0.18)]">
      {/* Quiz Header & Step */}
      <div className="flex justify-between items-end mb-8 border-b border-ivory-border pb-6">
        <div>
          <span className="font-serif italic text-brand text-xs font-semibold tracking-wider block mb-1">
            Calibration Sequence
          </span>
          <h2 className="text-2xl font-serif text-foreground font-semibold leading-tight">
            {step === 1 && "01 / Budget Allocation"}
            {step === 2 && "02 / Architecture & Propulsion"}
            {step === 3 && "03 / Calibration Weights"}
          </h2>
        </div>
        <div className="font-mono text-xs text-brand font-bold">
          [ 0{step} / 03 ]
        </div>
      </div>

      {/* Step Contents */}
      <div className="min-h-65 flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-ivory-text-muted font-serif leading-relaxed italic">
              Please declare your optimal capital allocation. Our engine will
              calibrate matches tailored to this specific financial landscape.
            </p>
            <div className="space-y-5 pt-4">
              <div className="flex justify-between items-end font-mono text-[10px] text-ivory-text-muted">
                <span>MIN: {formatINR(MIN_BUDGET)}</span>
                <span className="text-brand text-xl font-bold font-serif italic flex items-baseline gap-1.5">
                  {formatINR(budget)}
                  <span className="font-mono text-xs text-ivory-text-muted not-italic font-normal">
                    ({formatINRFull(budget)})
                  </span>
                </span>
                <span>MAX: {formatINR(MAX_BUDGET)}</span>
              </div>
              <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={BUDGET_STEP}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-1 bg-[#e8e2dc] rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <div className="flex gap-2 justify-center pt-2">
                {[2500000, 4500000, 7500000, 12000000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setBudget(preset)}
                    className={`font-mono text-xs py-1.5 px-3 rounded-full border transition-all cursor-pointer ${
                      budget === preset
                        ? "border-brand bg-brand/5 text-brand font-bold"
                        : "border-ivory-border text-ivory-text-muted hover:border-brand/40 hover:text-foreground"
                    }`}
                  >
                    {formatINR(preset)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            {/* Body Type Selection */}
            <div className="space-y-3">
              <label className="font-serif text-xs text-ivory-text-muted block italic font-semibold">
                Vehicle Silhouette Profile
              </label>
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map((type) => {
                  const selected = types.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={`py-2 px-5 rounded-full border text-center transition-all duration-200 cursor-pointer text-xs font-serif ${
                        selected
                          ? "border-brand bg-brand/5 text-brand font-bold"
                          : "border-ivory-border bg-white text-ivory-text-muted hover:border-brand/40 hover:text-foreground"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-ivory-text-muted/70 font-mono italic">
                * Leave unselected to search all profiles.
              </p>
            </div>

            {/* Powertrain Selection */}
            <div className="space-y-3 pt-2">
              <label className="font-serif text-xs text-ivory-text-muted block italic font-semibold">
                Propulsion Mechanism
              </label>
              <div className="flex flex-wrap gap-2">
                {fuelTypes.map((fuel) => {
                  const selected = fuels.includes(fuel);
                  return (
                    <button
                      key={fuel}
                      onClick={() => toggleFuel(fuel)}
                      className={`py-2 px-5 rounded-full border text-center transition-all duration-200 cursor-pointer text-xs font-serif ${
                        selected
                          ? "border-brand bg-brand/5 text-brand font-bold"
                          : "border-ivory-border bg-white text-ivory-text-muted hover:border-brand/40 hover:text-foreground"
                      }`}
                    >
                      {fuel}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-xs text-ivory-text-muted font-serif italic mb-4">
              Calibrate the relative priority of each driver metric to fine-tune
              your compatibility match.
            </p>
            {Object.entries(metrics).map(([key, val]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between items-center font-serif text-xs">
                  <span className="text-foreground italic font-semibold">
                    {key === "performance" && "Performance & Speed"}
                    {key === "efficiency" && "Energy & Range"}
                    {key === "utility" && "Utility & Cargo"}
                    {key === "comfort" && "Comfort & Luxury"}
                    {key === "value" && "Value & Lifespan"}
                  </span>
                  <span className="text-brand font-mono font-bold">
                    {val} / 10
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={val}
                    onChange={(e) =>
                      updateMetric(
                        key as keyof UserPreferences["metrics"],
                        Number(e.target.value),
                      )
                    }
                    className="flex-1 h-1 bg-[#e8e2dc] rounded-lg appearance-none cursor-pointer accent-brand"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controller Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-ivory-border">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`font-mono text-xs py-2 px-5 rounded-full border transition-all ${
            step === 1
              ? "opacity-30 cursor-not-allowed border-ivory-border text-ivory-text-muted"
              : "border-ivory-border text-foreground hover:bg-ivory-hover cursor-pointer"
          }`}
        >
          PREVIOUS
        </button>
        <button
          onClick={handleNext}
          className="font-mono text-xs py-2 px-6 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark transition-all cursor-pointer shadow-[0_4px_10px_rgba(184,152,112,0.2)]"
        >
          {step === 3 ? "FINALIZE ENGINE" : "NEXT STEP"}
        </button>
      </div>
    </div>
  );
}
