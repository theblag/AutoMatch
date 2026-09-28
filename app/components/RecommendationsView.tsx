"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  carsDatabase,
  BUDGET_STEP,
  fuelTypes,
  getRecommendations,
  MAX_BUDGET,
  MIN_BUDGET,
  type UserPreferences,
  vehicleTypes,
  formatINR,
} from "../data";
import CarCard from "./CarCard";
import CarComparison from "./CarComparison";

const STORAGE_KEY = "automatch-recommendations";
const PAGE_SIZE = 30;

interface SavedRecommendationState {
  preferences: UserPreferences;
  budget: number;
  types: string[];
  fuels: string[];
}

export default function RecommendationsView() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [activeBudget, setActiveBudget] = useState(5_500_000);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeFuels, setActiveFuels] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    startTransition(() => {
      if (saved) {
        try {
          const state = JSON.parse(saved) as SavedRecommendationState;
          setPreferences(state.preferences);
          setActiveBudget(
            Math.min(MAX_BUDGET, Math.max(MIN_BUDGET, state.budget)),
          );
          setActiveTypes(state.types);
          setActiveFuels(state.fuels);
        } catch {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!isLoaded || !preferences) return;
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        preferences,
        budget: activeBudget,
        types: activeTypes,
        fuels: activeFuels,
      } satisfies SavedRecommendationState),
    );
  }, [isLoaded, preferences, activeBudget, activeTypes, activeFuels]);

  const recommendations = useMemo(() => {
    if (!preferences) return [];
    return getRecommendations({
      ...preferences,
      budget: activeBudget,
      types: activeTypes,
      fuels: activeFuels,
    });
  }, [preferences, activeBudget, activeTypes, activeFuels]);

  const selectedCars = useMemo(
    () => carsDatabase.filter((car) => selectedCompareIds.includes(car.id)),
    [selectedCompareIds],
  );

  const pageCount = Math.ceil(recommendations.length / PAGE_SIZE);
  const visibleRecommendations = recommendations.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const toggleType = (type: string) => {
    setPage(0);
    setActiveTypes((current) =>
      current.includes(type)
        ? current.filter((entry) => entry !== type)
        : [...current, type],
    );
  };

  const toggleFuel = (fuel: string) => {
    setPage(0);
    setActiveFuels((current) =>
      current.includes(fuel)
        ? current.filter((entry) => entry !== fuel)
        : [...current, fuel],
    );
  };

  const toggleCompare = (carId: string) => {
    setSelectedCompareIds((current) => {
      if (current.includes(carId)) return current.filter((id) => id !== carId);
      if (current.length >= 3) {
        window.alert("You can compare up to three vehicles at a time.");
        return current;
      }
      return [...current, carId];
    });
  };

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-editorial-pattern px-6 py-20 text-center font-serif text-ivory-text-muted">
        Restoring your recommendations...
      </main>
    );
  }

  if (!preferences) {
    return (
      <main className="min-h-screen bg-editorial-pattern px-6 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold text-foreground">
          No active recommendation session
        </h1>
        <Link
          href="/"
          className="mt-5 inline-block font-serif text-brand underline"
        >
          Start a new vehicle search
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-editorial-pattern pb-28 text-foreground">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ivory-border bg-white/90 px-5 py-4 backdrop-blur-md md:px-8">
        <Link
          href="/"
          className="font-serif text-sm font-bold uppercase tracking-[0.16em]"
        >
          AUTOMATCH <span className="italic text-brand">{"//"}</span> CURATOR
        </Link>
        <Link
          href="/"
          className="font-serif text-xs italic text-ivory-text-muted underline underline-offset-4"
        >
          New search
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-8 md:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit space-y-6 border border-ivory-border bg-white p-5">
          <div className="border-b border-ivory-border pb-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand">
              Weighted match
            </p>
            <h1 className="mt-1 font-serif text-xl font-semibold">
              Refine results
            </h1>
          </div>

          <label className="block space-y-2">
            <span className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-ivory-text-muted">
              <span>Maximum budget</span>
              <span className="font-bold text-brand">
                {formatINR(activeBudget)}
              </span>
            </span>
            <input
              type="range"
              min={MIN_BUDGET}
              max={MAX_BUDGET}
              step={BUDGET_STEP}
              value={activeBudget}
              onChange={(event) => {
                setPage(0);
                setActiveBudget(Number(event.target.value));
              }}
              className="w-full accent-brand"
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-ivory-text-muted">
              Body type
            </legend>
            {vehicleTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 font-serif text-sm"
              >
                <input
                  type="checkbox"
                  checked={activeTypes.includes(type)}
                  onChange={() => toggleType(type)}
                  className="accent-brand"
                />
                {type}
              </label>
            ))}
          </fieldset>

          <fieldset className="space-y-2 border-t border-ivory-border pt-4">
            <legend className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-ivory-text-muted">
              Fuel type
            </legend>
            {fuelTypes.map((fuel) => (
              <label
                key={fuel}
                className="flex items-center gap-2 font-serif text-sm"
              >
                <input
                  type="checkbox"
                  checked={activeFuels.includes(fuel)}
                  onChange={() => toggleFuel(fuel)}
                  className="accent-brand"
                />
                {fuel}
              </label>
            ))}
          </fieldset>
        </aside>

        <section className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ivory-border pb-4">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand">
                {carsDatabase.length.toLocaleString("en-IN")} catalog variants
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold">
                Your ranked matches
              </h2>
            </div>
            <p className="font-mono text-[10px] text-ivory-text-muted">
              {recommendations.length.toLocaleString("en-IN")} results · highest
              score first
            </p>
          </div>

          {visibleRecommendations.length ? (
            visibleRecommendations.map(({ car, matchPercentage }) => (
              <CarCard
                key={car.id}
                car={car}
                matchPercentage={matchPercentage}
                userMetrics={preferences.metrics}
                isCompared={selectedCompareIds.includes(car.id)}
                onCompareToggle={() => toggleCompare(car.id)}
                compareCount={selectedCompareIds.length}
              />
            ))
          ) : (
            <div className="border border-dashed border-ivory-border bg-white p-10 text-center">
              <h3 className="font-serif text-lg font-semibold">
                No vehicles match these filters
              </h3>
              <p className="mt-2 font-serif text-sm italic text-ivory-text-muted">
                Raise the budget or clear a body/fuel filter.
              </p>
            </div>
          )}

          {pageCount > 1 && (
            <nav
              aria-label="Recommendation pages"
              className="flex items-center justify-between border-t border-ivory-border pt-4"
            >
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="border border-ivory-border bg-white px-4 py-2 font-mono text-[10px] uppercase disabled:opacity-40"
              >
                Previous
              </button>
              <span className="font-mono text-[10px] text-ivory-text-muted">
                {page + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(pageCount - 1, current + 1))
                }
                disabled={page >= pageCount - 1}
                className="border border-ivory-border bg-white px-4 py-2 font-mono text-[10px] uppercase disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>

      {selectedCompareIds.length > 0 && (
        <div className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-ivory-border bg-white p-4 shadow-[0_-10px_30px_rgba(200,190,175,0.15)]">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <p className="font-serif text-xs italic text-brand">
              {selectedCars
                .map((car) => `${car.make} ${car.model} ${car.variant}`)
                .join(" · ")}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedCompareIds([])}
                className="px-3 py-2 font-mono text-[9px] text-ivory-text-muted"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsCompareOpen(true)}
                className="bg-brand px-4 py-2 font-mono text-[9px] font-bold text-white"
              >
                Compare ({selectedCompareIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {isCompareOpen && (
        <CarComparison
          selectedCars={selectedCars}
          onRemove={toggleCompare}
          onClose={() => setIsCompareOpen(false)}
        />
      )}
    </main>
  );
}
