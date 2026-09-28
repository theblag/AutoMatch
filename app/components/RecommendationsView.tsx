"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  carsDatabase,
  BUDGET_STEP,
  fuelTypes,
  MAX_BUDGET,
  MIN_BUDGET,
  type UserPreferences,
  type Car,
  vehicleTypes,
  formatINR,
} from "../data";
import CarCard from "./CarCard";
import CarComparison from "./CarComparison";
import HeaderAuth from "./HeaderAuth";
import {
  getVectorRecommendations,
  type RecommendationResult,
  extractCarVector,
} from "@/lib/vectorRecommender";
import { adaptUserVector, type UserVectorData } from "@/lib/types";
import RecommendationSkeletonGrid from "./RecommendationSkeletonGrid";

const PAGE_SIZE = 25;

export default function RecommendationsView() {
  const [, startTransition] = useTransition();

  // Active User & Vector State
  const [activeVector, setActiveVector] = useState<UserVectorData>({
    affordability: 0.6,
    familySafety: 0.6,
    terrainClearance: 0.6,
    urbanAgility: 0.6,
    performancePower: 0.6,
    fuelEfficiency: 0.6,
    techComfort: 0.6,
  });

  // Filter adjustment states
  const [activeBudget, setActiveBudget] = useState(5_500_000);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeFuels, setActiveFuels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState("");

  // Comparison & Pagination & Shortlist & View Mode
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "starred">("all");
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [telemetryNotice, setTelemetryNotice] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Check initial session & saved state
  useEffect(() => {
    async function init() {
      try {
        // 1. Check if user is logged into Neon DB
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          if (data.needsProfileSetup) {
            window.location.href = "/onboarding";
            return;
          }
          if (data.vector) {
            setActiveVector(data.vector);
          }
          if (data.user?.budgetMax) {
            setActiveBudget(data.user.budgetMax);
          }
          if (data.shortlistedCarIds && Array.isArray(data.shortlistedCarIds)) {
            setShortlistedIds(data.shortlistedCarIds);
          }
          return;
        }

        // 2. Fallback to quiz state if stored in session
        const saved = sessionStorage.getItem("automatch-recommendations");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.budget) setActiveBudget(parsed.budget);
            if (parsed.types) setActiveTypes(parsed.types);
            if (parsed.fuels) setActiveFuels(parsed.fuels);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn("Session check error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Compute Vector Recommendations dynamically via Cosine Similarity in Latent Space
  const vectorResults: RecommendationResult[] = useMemo(() => {
    return getVectorRecommendations(activeVector, {
      budgetLimit: activeBudget >= MAX_BUDGET ? 0 : activeBudget,
      types: activeTypes,
      fuels: activeFuels,
      searchQuery: activeSearch,
    });
  }, [activeVector, activeBudget, activeTypes, activeFuels, activeSearch]);

  // Handle Search Submission (Logs to Neon DB, Filters Catalog & Shifts Vector)
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setActiveSearch(query);
    setPage(0);

    if (!query) {
      setSearchFeedback("");
      return;
    }

    setIsSearching(true);
    setSearchFeedback(`Filtering for "${query}" & tuning 7D AI vector...`);

    try {
      const res = await fetch("/api/telemetry/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          filters: { budget: activeBudget, types: activeTypes, fuels: activeFuels },
          currentVector: activeVector,
        }),
      });

      const data = await res.json();
      if (data.updatedVector) {
        setActiveVector(data.updatedVector);
        setSearchFeedback(`✓ Filtered for "${query}" · Vector tuned in Neon DB`);
      } else {
        setSearchFeedback(`✓ Filtered for "${query}"`);
      }
    } catch (err) {
      console.error("Telemetry failed:", err);
      setSearchFeedback(`Filtered for "${query}"`);
    } finally {
      setIsSearching(false);
      setTimeout(() => setSearchFeedback(""), 5000);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
    setPage(0);
  };

  const handleVectorUpdatedFromAuth = (newVector: UserVectorData) => {
    setActiveVector(newVector);
    setPage(0);
  };

  // Central Adaptive Telemetry Handler: shifts active vector & persists to Neon DB
  const handleCarInteraction = async (
    car: Car,
    actionType: "CLICK" | "VIEW_SPECS" | "COMPARE" | "LIKE",
  ) => {
    const carVec = extractCarVector(car);

    // 1. Immediately update activeVector in React state -> instant re-ranking!
    const newVector = adaptUserVector(activeVector, carVec.vector, actionType);
    setActiveVector(newVector);

    // 2. Visual Telemetry Notification Toast
    const actionLabel =
      actionType === "LIKE"
        ? "Shortlisted"
        : actionType === "COMPARE"
        ? "Added to Compare"
        : actionType === "VIEW_SPECS"
        ? "Inspected Specs"
        : "Clicked";

    setTelemetryNotice(
      `✦ AI Re-ranking Live: Shifted preferences toward ${car.make} ${car.model} (${actionLabel})`,
    );
    setTimeout(() => {
      setTelemetryNotice((curr) => (curr.includes(car.model) ? "" : curr));
    }, 4500);

    // 3. Persist updated vector to Neon DB user_vectors with pgvector & log user_interactions
    try {
      const res = await fetch("/api/telemetry/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId: car.id,
          carName: `${car.make} ${car.model}`,
          actionType,
          carVector: carVec.vector,
          currentVector: activeVector,
        }),
      });
      const data = await res.json();
      if (data.success && data.updatedVector) {
        setActiveVector(data.updatedVector);
      }
    } catch {
      // background network failure gracefully handled
    }
  };

  // Compare toggle with Neon interaction logging
  const toggleCompare = (carId: string) => {
    const isAdding = !selectedCompareIds.includes(carId);

    setSelectedCompareIds((current) => {
      if (current.includes(carId)) return current.filter((id) => id !== carId);
      if (current.length >= 3) {
        window.alert("You can compare up to three vehicles at a time.");
        return current;
      }
      return [...current, carId];
    });

    if (isAdding) {
      const car = carsDatabase.find((c) => c.id === carId);
      if (car) {
        handleCarInteraction(car, "COMPARE");
      }
    }
  };

  // Shortlist / Like toggle: strong preference signal
  const toggleShortlist = (car: Car) => {
    const isShortlisting = !shortlistedIds.includes(car.id);
    setShortlistedIds((curr) =>
      curr.includes(car.id)
        ? curr.filter((id) => id !== car.id)
        : [...curr, car.id],
    );

    if (isShortlisting) {
      handleCarInteraction(car, "LIKE");
    } else {
      fetch("/api/telemetry/interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carId: car.id, actionType: "UNLIKE" }),
      }).catch((err) => console.warn("Failed to un-shortlist in DB:", err));
    }
  };

  const selectedCars = useMemo(
    () => carsDatabase.filter((car) => selectedCompareIds.includes(car.id)),
    [selectedCompareIds],
  );

  const displayedResults = useMemo(() => {
    if (viewMode === "starred") {
      // Starred view: returns all vehicles that have been starred by the user, ranked by Cosine Similarity
      return getVectorRecommendations(activeVector, {
        searchQuery: activeSearch,
      }).filter((item) => shortlistedIds.includes(item.car.id));
    }
    return vectorResults;
  }, [viewMode, vectorResults, activeVector, activeSearch, shortlistedIds]);

  const pageCount = Math.ceil(displayedResults.length / PAGE_SIZE);
  const visibleRecommendations = displayedResults.slice(
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

  return (
    <main className="min-h-screen bg-editorial-pattern pb-28 text-foreground">
      {/* Header with Neon DB Auth & Inspector */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ivory-border bg-white/90 px-5 py-4 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-serif text-sm font-bold uppercase tracking-[0.16em]"
          >
            AUTOMATCH <span className="italic text-brand">{"//"}</span> CURATOR
          </Link>
          <span className="hidden font-mono text-[9px] uppercase tracking-wider text-ivory-text-muted md:inline-block">
            {carsDatabase.length.toLocaleString("en-IN")} real vehicles
          </span>
        </div>
        <HeaderAuth onVectorUpdated={handleVectorUpdatedFromAuth} />
      </header>

      {/* Main Content Layout */}
      <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-8 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar Filters */}
        <aside className="h-fit space-y-6 border border-ivory-border bg-white p-5 rounded-2xl shadow-xs">
          <div className="border-b border-ivory-border pb-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand">
              pgvector Cosine Search
            </p>
            <h1 className="mt-1 font-serif text-xl font-semibold">
              Refine Parameters
            </h1>
          </div>

          {/* Starred View Quick Filter Toggle */}
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 font-bold text-sm">★</span>
              <div>
                <p className="font-serif text-xs font-semibold text-amber-950">Starred Vehicles</p>
                <p className="font-mono text-[9px] text-amber-700/80">{shortlistedIds.length} saved in Neon DB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setViewMode((prev) => (prev === "starred" ? "all" : "starred"));
                setPage(0);
              }}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "starred"
                  ? "bg-amber-500 text-white shadow-2xs"
                  : "bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/60"
              }`}
            >
              {viewMode === "starred" ? "Viewing" : "View"}
            </button>
          </div>

          {/* Budget Filter */}
          <label className="block space-y-2">
            <span className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-ivory-text-muted">
              <span>Budget Ceiling</span>
              <span className="font-bold text-brand">
                {activeBudget >= MAX_BUDGET ? "All Budgets (No Limit)" : formatINR(activeBudget)}
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

          {/* Body Type Filter */}
          <fieldset className="space-y-2 border-t border-ivory-border pt-4">
            <legend className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-ivory-text-muted">
              Body Type
            </legend>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {vehicleTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 font-serif text-xs cursor-pointer hover:text-brand"
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
            </div>
          </fieldset>

          {/* Fuel Type Filter */}
          <fieldset className="space-y-2 border-t border-ivory-border pt-4">
            <legend className="mb-2 font-mono text-[9px] font-bold uppercase tracking-widest text-ivory-text-muted">
              Fuel Type
            </legend>
            <div className="space-y-1.5">
              {fuelTypes.map((fuel) => (
                <label
                  key={fuel}
                  className="flex items-center gap-2 font-serif text-xs cursor-pointer hover:text-brand"
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
            </div>
          </fieldset>
        </aside>

        {/* Results Area */}
        <section className="min-w-0 space-y-5">
          {/* Natural Language Search Bar (Feeds telemetry & shifts vector) */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white p-3 border border-ivory-border rounded-2xl shadow-xs flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand, model, or capability (e.g. 'Tata', 'Creta', 'hybrid SUV', 'sunroof')..."
                className="w-full px-4 py-2.5 text-xs border border-ivory-border rounded-xl focus:outline-brand bg-ivory-bg/30 font-sans pr-8"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 text-ivory-text-muted hover:text-foreground text-xs font-mono"
                  title="Clear search input"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-brand text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSearching ? "Tuning Vector..." : "Search & Adapt"}
            </button>
          </form>

          {/* Active Search Filter Badge */}
          {activeSearch && (
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-xs font-serif text-ivory-text-muted">
                Active Search Filter:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-mono font-bold rounded-full">
                <span>&ldquo;{activeSearch}&rdquo;</span>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="hover:text-red-600 transition-colors ml-1 font-bold cursor-pointer"
                  title="Clear search filter"
                >
                  ✕
                </button>
              </span>
              <span className="text-[11px] font-mono text-ivory-text-muted">
                ({vectorResults.length} matching vehicles)
              </span>
            </div>
          )}

          {searchFeedback && (
            <div className="p-2.5 bg-brand/10 border border-brand/20 text-brand font-mono text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
              <span>✦</span>
              <span>{searchFeedback}</span>
            </div>
          )}

          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-ivory-border pb-3">
            <button
              type="button"
              onClick={() => {
                setViewMode("all");
                setPage(0);
              }}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "all"
                  ? "bg-brand text-white shadow-xs"
                  : "bg-white border border-ivory-border text-ivory-text-muted hover:text-foreground hover:bg-ivory-bg"
              }`}
            >
              <span>✦ All Recommendations</span>
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full ${
                  viewMode === "all"
                    ? "bg-white/20 text-white"
                    : "bg-ivory-bg text-ivory-text-muted"
                }`}
              >
                {vectorResults.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode("starred");
                setPage(0);
              }}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === "starred"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-white border border-ivory-border text-ivory-text-muted hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50/50"
              }`}
            >
              <span>★ Starred</span>
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                  viewMode === "starred"
                    ? "bg-white/20 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {shortlistedIds.length}
              </span>
            </button>
          </div>

          {/* Results Summary Bar */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ivory-border pb-4">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-brand">
                {viewMode === "starred"
                  ? `${displayedResults.length} Starred Vehicles in Profile`
                  : `${vectorResults.length.toLocaleString("en-IN")} Real Catalog Variants`}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold">
                {viewMode === "starred" ? "Starred Vehicles" : "Vector-Ranked Matches"}
              </h2>
            </div>
            <p className="font-mono text-[10px] text-ivory-text-muted">
              {viewMode === "starred"
                ? "Saved to your profile in Neon PostgreSQL"
                : "Ranked via Cosine Similarity in 7D Space"}
            </p>
          </div>

          {/* Cards List or Loading Grid */}
          {isLoading ? (
            <RecommendationSkeletonGrid count={5} />
          ) : visibleRecommendations.length ? (
            visibleRecommendations.map((item) => (
              <CarCard
                key={item.car.id}
                car={item.car}
                matchPercentage={item.matchPercentage}
                explanationBadges={item.explanationBadges}
                isCompared={selectedCompareIds.includes(item.car.id)}
                onCompareToggle={() => toggleCompare(item.car.id)}
                compareCount={selectedCompareIds.length}
                isShortlisted={shortlistedIds.includes(item.car.id)}
                onShortlistToggle={() => toggleShortlist(item.car)}
                onViewSpecs={() => handleCarInteraction(item.car, "VIEW_SPECS")}
              />
            ))
          ) : viewMode === "starred" ? (
            <div className="border border-dashed border-amber-300 bg-amber-50/50 p-10 text-center rounded-2xl space-y-3">
              <span className="text-3xl">★</span>
              <h3 className="font-serif text-lg font-semibold text-amber-950">
                No starred vehicles yet
              </h3>
              <p className="font-serif text-sm italic text-amber-800/80 max-w-md mx-auto">
                Click &ldquo;☆ Star&rdquo; on any vehicle card to save it to your personal shortlist in Neon DB and tune your AI vector.
              </p>
              <button
                type="button"
                onClick={() => {
                  setViewMode("all");
                  setPage(0);
                }}
                className="mt-3 px-5 py-2.5 bg-brand text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-brand-dark transition-colors cursor-pointer"
              >
                Browse All Vehicles
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-ivory-border bg-white p-10 text-center rounded-2xl">
              <h3 className="font-serif text-lg font-semibold">
                No vehicles match these specific constraints
              </h3>
              <p className="mt-2 font-serif text-sm italic text-ivory-text-muted">
                Try raising the budget ceiling or unchecking body/fuel filters.
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {pageCount > 1 && (
            <nav
              aria-label="Recommendation pages"
              className="flex items-center justify-between border-t border-ivory-border pt-4"
            >
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={page === 0}
                className="border border-ivory-border bg-white px-4 py-2 font-mono text-[10px] uppercase disabled:opacity-40 rounded-lg hover:bg-ivory-bg transition-colors"
              >
                Previous
              </button>
              <span className="font-mono text-[10px] text-ivory-text-muted">
                Page {page + 1} of {pageCount} ({vectorResults.length} vehicles)
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(pageCount - 1, current + 1))
                }
                disabled={page >= pageCount - 1}
                className="border border-ivory-border bg-white px-4 py-2 font-mono text-[10px] uppercase disabled:opacity-40 rounded-lg hover:bg-ivory-bg transition-colors"
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>

      {/* Comparison Drawer */}
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
                className="bg-brand px-4 py-2 font-mono text-[9px] font-bold text-white rounded-lg hover:bg-brand-dark"
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

      {/* Floating Live AI Re-Ranking Notification Toast */}
      {telemetryNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-brand/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
          </span>
          <span className="font-mono text-xs font-bold tracking-tight">
            {telemetryNotice}
          </span>
        </div>
      )}
    </main>
  );
}
