"use client";

import React, { useState, useMemo } from "react";
import {
  getRecommendations,
  UserPreferences,
  carsDatabase,
  formatINR,
} from "./data/cars";
import TelemetryQuiz from "./components/TelemetryQuiz";
import CarCard from "./components/CarCard";
import CarComparison from "./components/CarComparison";

export default function Home() {
  const [view, setView] = useState<"WELCOME" | "QUIZ" | "RESULTS">("WELCOME");

  // Quiz state
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);

  // Filter adjustment states (initialized from quiz preferences but modifiable)
  const [activeBudget, setActiveBudget] = useState<number>(5500000);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeFuels, setActiveFuels] = useState<string[]>([]);

  // Comparison states
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Launch the quiz
  const handleStartQuiz = () => {
    setView("QUIZ");
  };

  // Complete the quiz
  const handleQuizComplete = (prefs: UserPreferences) => {
    setUserPrefs(prefs);
    setActiveBudget(prefs.budget);
    setActiveTypes(prefs.types);
    setActiveFuels(prefs.fuels);
    setView("RESULTS");
  };

  // Re-run recommendation engine when preferences or filter adjustments change
  const recommendations = useMemo(() => {
    if (!userPrefs) return [];

    // Merge baseline user preferences with active filter adjustments
    const currentPrefs: UserPreferences = {
      ...userPrefs,
      budget: activeBudget,
      types: activeTypes,
      fuels: activeFuels,
    };

    return getRecommendations(currentPrefs);
  }, [userPrefs, activeBudget, activeTypes, activeFuels]);

  // Handle comparison toggles
  const handleCompareToggle = (carId: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(carId)) {
        return prev.filter((id) => id !== carId);
      }
      if (prev.length >= 3) {
        // Limit to 3 max
        alert(
          "You can select a maximum of 3 vehicles for comparative diagnostics.",
        );
        return prev;
      }
      return [...prev, carId];
    });
  };

  const selectedCarsForComparison = useMemo(() => {
    return carsDatabase.filter((car) => selectedCompareIds.includes(car.id));
  }, [selectedCompareIds]);

  const handleReset = () => {
    setUserPrefs(null);
    setSelectedCompareIds([]);
    setView("WELCOME");
  };

  const toggleTypeFilter = (type: string) => {
    setActiveTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleFuelFilter = (fuel: string) => {
    setActiveFuels((prev) =>
      prev.includes(fuel) ? prev.filter((f) => f !== fuel) : [...prev, fuel],
    );
  };

  return (
    <div className="min-h-screen bg-editorial-pattern text-foreground flex flex-col font-sans select-none">
      {/* Top Editorial Header */}
      <header className="border-b border-ivory-border bg-white/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-brand flex items-center justify-center font-serif font-bold text-white text-xs shadow-sm">
            A
          </div>
          <div>
            <span className="font-serif text-sm font-bold tracking-widest text-foreground uppercase">
              AUTOMATCH{" "}
              <span className="text-brand font-normal italic font-serif">
                {"//"}
              </span>{" "}
              CURATOR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 font-serif text-[10px] text-ivory-text-muted italic">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-brand" />
              Archives Verified
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-brand" />
              Engine Online
            </div>
          </div>

          {userPrefs && (
            <button
              onClick={handleReset}
              className="font-mono text-[9px] text-rose-700 hover:text-rose-600 border border-rose-200 bg-rose-50 px-3 py-1.5 rounded-full transition-all cursor-pointer"
            >
              RESET CURATOR [-]
            </button>
          )}
        </div>
      </header>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col justify-center py-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {view === "WELCOME" && (
          <div className="text-center max-w-2xl mx-auto space-y-8 py-12">
            <div className="inline-block px-4 py-1.5 rounded-full border border-brand/20 bg-brand/5 font-serif text-[10px] text-brand tracking-widest uppercase italic font-bold">
              Sequence Ready
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-foreground leading-tight">
                Curate Your <br />
                <span className="text-brand italic font-serif">
                  Ideal Drive
                </span>
              </h1>
              <p className="text-sm md:text-base text-ivory-text-muted font-serif italic leading-relaxed max-w-lg mx-auto">
                An algorithm matching mechanical profiles. We weigh vehicle
                structure, dynamics, energy chemistry, and comfort parameters to
                surface your perfect automotive match.
              </p>
            </div>

            {/* Premium stats cards */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-4 font-serif text-[10px] text-ivory-text-muted italic">
              <div className="bg-white p-3 rounded-2xl border border-ivory-border shadow-sm">
                <span className="block text-brand font-bold text-base not-italic font-mono mb-0.5">
                  10
                </span>
                ARCHITECTURES
              </div>
              <div className="bg-white p-3 rounded-2xl border border-ivory-border shadow-sm">
                <span className="block text-brand font-bold text-base not-italic font-mono mb-0.5">
                  5-AXIS
                </span>
                METRIC RADAR
              </div>
              <div className="bg-white p-3 rounded-2xl border border-ivory-border shadow-sm">
                <span className="block text-brand font-bold text-base not-italic font-mono mb-0.5">
                  0.02s
                </span>
                CURATION SPEED
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleStartQuiz}
                className="font-mono text-xs py-3.5 px-8 rounded-full bg-brand text-white font-semibold hover:bg-brand-dark transition-all cursor-pointer shadow-[0_5px_15px_rgba(184,152,112,0.3)]"
              >
                BEGIN CURATION SEQUENCE [+]
              </button>
            </div>
          </div>
        )}

        {view === "QUIZ" && (
          <div className="py-6">
            <TelemetryQuiz onComplete={handleQuizComplete} />
          </div>
        )}

        {view === "RESULTS" && userPrefs && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 py-4 items-start">
            {/* Left Filter & Recalibrate Bar */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-ivory-border shadow-sm space-y-6">
              <div className="border-b border-ivory-border pb-4">
                <span className="font-serif italic text-brand text-[10px] font-bold tracking-wider uppercase block">
                  Curation Controls
                </span>
                <h3 className="text-sm font-serif font-bold text-foreground mt-0.5">
                  REFINE PARAMETERS
                </h3>
              </div>

              {/* Budget slider */}
              <div className="space-y-2">
                <div className="flex justify-between font-serif text-[10px] text-ivory-text-muted">
                  <span>MAX BUDGET</span>
                  <span className="text-brand font-mono font-bold">
                    {formatINR(activeBudget)}
                  </span>
                </div>
                <input
                  type="range"
                  min="600000"
                  max="15000000"
                  step="250000"
                  value={activeBudget}
                  onChange={(e) => setActiveBudget(Number(e.target.value))}
                  className="w-full h-1 bg-[#e8e2dc] rounded-lg appearance-none cursor-pointer accent-brand"
                />
              </div>

              {/* Body Type Checkboxes */}
              <div className="space-y-3">
                <span className="font-serif text-[10px] text-ivory-text-muted block uppercase tracking-wider italic font-bold">
                  SILHOUETTES
                </span>
                <div className="flex flex-wrap lg:flex-col gap-1.5">
                  {["SUV", "Sedan", "Hatchback", "MUV"].map((type) => {
                    const isChecked = activeTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleTypeFilter(type)}
                        className={`text-left font-serif text-[10px] py-2 px-4 rounded-full border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? "border-brand bg-brand/5 text-brand font-bold"
                            : "border-ivory-border text-ivory-text-muted hover:border-brand/40 hover:text-foreground"
                        }`}
                      >
                        <span>{type}</span>
                        <span>{isChecked ? "●" : "○"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Propulsion Type Checkboxes */}
              <div className="space-y-3">
                <span className="font-serif text-[10px] text-ivory-text-muted block uppercase tracking-wider italic font-bold">
                  PROPULSION
                </span>
                <div className="flex flex-wrap lg:flex-col gap-1.5">
                  {["Electric", "Hybrid", "Petrol", "Diesel"].map((fuel) => {
                    const isChecked = activeFuels.includes(fuel);
                    return (
                      <button
                        key={fuel}
                        onClick={() => toggleFuelFilter(fuel)}
                        className={`text-left font-serif text-[10px] py-2 px-4 rounded-full border transition-all flex items-center justify-between cursor-pointer ${
                          isChecked
                            ? "border-brand bg-brand/5 text-brand font-bold"
                            : "border-ivory-border text-ivory-text-muted hover:border-brand/40 hover:text-foreground"
                        }`}
                      >
                        <span>{fuel}</span>
                        <span>{isChecked ? "●" : "○"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manual restart button */}
              <div className="pt-4 border-t border-ivory-border">
                <button
                  onClick={() => setView("QUIZ")}
                  className="w-full font-mono text-[9px] py-2.5 px-4 rounded-full border border-brand text-brand hover:bg-brand/5 text-center font-bold tracking-wide transition-all cursor-pointer"
                >
                  RE-CALIBRATE SEQUENCE
                </button>
              </div>
            </div>

            {/* Right Recommendation List Grid */}
            <div className="lg:col-span-3 space-y-6">
              {/* Telemetry info row */}
              <div className="flex justify-between items-center font-serif italic text-[11px] text-ivory-text-muted bg-white p-4 rounded-2xl border border-ivory-border shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                  Scanned: {carsDatabase.length} vehicle options
                </div>
                <div>
                  Matched:{" "}
                  {
                    recommendations.filter((r) => r.matchPercentage >= 70)
                      .length
                  }{" "}
                  high-accuracy recommendations
                </div>
              </div>

              {/* Render matches */}
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {recommendations.map(({ car, matchPercentage }) => (
                    <CarCard
                      key={car.id}
                      car={car}
                      matchPercentage={matchPercentage}
                      userMetrics={userPrefs.metrics}
                      isCompared={selectedCompareIds.includes(car.id)}
                      onCompareToggle={() => handleCompareToggle(car.id)}
                      compareCount={selectedCompareIds.length}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-3xl border-dashed border-2 border-ivory-border">
                  <span className="text-rose-600 font-serif italic text-sm block mb-2 font-bold">
                    No architectures matched your parameters
                  </span>
                  <p className="text-xs text-ivory-text-muted font-serif italic max-w-sm mx-auto">
                    Try adjusting your criteria in the control panel (e.g.,
                    increase max budget or select multiple propulsion types).
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating comparison drawer */}
      {selectedCompareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-ivory-border shadow-[0_-10px_30px_rgba(200,190,175,0.15)] p-4 animate-slideUp">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline font-serif italic text-[10px] text-brand font-bold uppercase tracking-wider">
                Compare Matrix //
              </span>
              <div className="flex gap-2">
                {selectedCarsForComparison.map((car) => (
                  <div
                    key={car.id}
                    className="font-serif italic text-[10px] bg-ivory-bg border border-ivory-border py-1 px-3 rounded-full flex items-center gap-2 text-foreground font-semibold"
                  >
                    <span>
                      {car.make} {car.model}
                    </span>
                    <button
                      onClick={() => handleCompareToggle(car.id)}
                      className="text-rose-600 hover:text-rose-500 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedCompareIds([])}
                className="font-mono text-[9px] text-ivory-text-muted hover:text-foreground px-3 py-2 cursor-pointer"
              >
                CLEAR ALL
              </button>
              <button
                onClick={() => setIsCompareOpen(true)}
                className="font-mono text-[9px] bg-brand text-white font-bold px-4 py-2 rounded-full hover:bg-brand-dark transition-all cursor-pointer shadow-[0_4px_10px_rgba(184,152,112,0.2)]"
              >
                OPEN SPECS MATRIX ({selectedCompareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side comparison modal */}
      {isCompareOpen && (
        <CarComparison
          selectedCars={selectedCarsForComparison}
          onRemove={handleCompareToggle}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* Bottom spacer if compare bar is open */}
      {selectedCompareIds.length > 0 && <div className="h-16" />}
    </div>
  );
}
