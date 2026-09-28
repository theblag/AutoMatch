"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  computeColdStartVector,
  type UserDemographics,
  type UserVectorData,
  type AuthUser,
} from "@/lib/types";
import { formatINR } from "@/app/data";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Lifestyle priors state
  const [age, setAge] = useState(29);
  const [maritalStatus, setMaritalStatus] = useState<
    "Single" | "Married" | "Married with Kids" | "Joint Family"
  >("Married with Kids");
  const [locationType, setLocationType] = useState<
    "Metro / City" | "Suburban / Highway" | "Hilly / Rough Terrain"
  >("Metro / City");
  const [primaryUsage, setPrimaryUsage] = useState<
    | "Daily Commute"
    | "Family Road Trips"
    | "Performance Enthusiast"
    | "Rural / Rough Roads"
  >("Daily Commute");
  const [budgetMax, setBudgetMax] = useState(2500000);

  // Check user session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        let res = await fetch("/api/auth/me");
        let data = await res.json();

        // If not authenticated immediately, retry once after 350ms to allow session cookies to flush
        if (!data.authenticated || !data.user) {
          await new Promise((resolve) => setTimeout(resolve, 350));
          res = await fetch("/api/auth/me");
          data = await res.json();
        }

        if (!data.authenticated || !data.user) {
          // If still not logged in, redirect to home to sign in first
          router.push("/");
          return;
        }

        if (data.user.profileCompleted) {
          // If profile is ALREADY completed, never ask again -> redirect to recommendations
          router.push("/recommendations");
          return;
        }

        setUser(data.user);
        if (data.user.age) setAge(data.user.age);
        if (data.user.maritalStatus) setMaritalStatus(data.user.maritalStatus);
        if (data.user.locationType) setLocationType(data.user.locationType);
        if (data.user.primaryUsage) setPrimaryUsage(data.user.primaryUsage);
        if (data.user.budgetMax) setBudgetMax(data.user.budgetMax);
      } catch (err) {
        console.error("Session check error:", err);
        router.push("/");
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkAuth();
  }, [router]);

  // Live 7D Latent Vector Projection based on user's current choices
  const projectedVector: UserVectorData = useMemo(() => {
    const demo: UserDemographics = {
      age,
      maritalStatus,
      locationType,
      primaryUsage,
      budgetMax,
    };
    return computeColdStartVector(demo);
  }, [age, maritalStatus, locationType, primaryUsage, budgetMax]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          maritalStatus,
          locationType,
          primaryUsage,
          budgetMax,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save profile preferences.");
      }

      // Profile completed! Transition to recommendations
      router.push("/recommendations");
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-pattern">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs text-ivory-text-muted">
            Checking session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-pattern text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/20 rounded-full text-brand font-mono text-[10px] font-bold uppercase tracking-wider">
            <span>✦ Cold-Start Demographic Calibration</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Welcome, {user?.name || "Driver"}!
          </h1>
          <p className="font-serif text-sm sm:text-base italic text-ivory-text-muted max-w-xl mx-auto">
            Because your account is brand new, please share your lifestyle and driving priorities once.
            Our engine uses this to calculate your initial 7D latent vector in Neon DB and rank the vehicles you see.
          </p>
        </div>

        {/* Main Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-ivory-border rounded-2xl shadow-xl p-6 sm:p-8 space-y-8"
        >
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-sans rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* 1. Age & Budget Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Age */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="font-serif font-bold text-sm text-foreground">
                  Your Age
                </label>
                <span className="font-mono text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                  {age} years old
                </span>
              </div>
              <input
                type="range"
                min={18}
                max={75}
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
                className="w-full accent-brand cursor-pointer"
              />
              <span className="text-[11px] text-ivory-text-muted block">
                Adjusts comfort, safety weightings, and sporty vehicle affinity.
              </span>
            </div>

            {/* Maximum Budget */}
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <label className="font-serif font-bold text-sm text-foreground">
                  Target / Maximum Budget
                </label>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {formatINR(budgetMax)}
                </span>
              </div>
              <input
                type="range"
                min={400000}
                max={15000000}
                step={100000}
                value={budgetMax}
                onChange={(e) => setBudgetMax(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <span className="text-[11px] text-ivory-text-muted block">
                Filters initial catalog and calibrates Affordability dimension.
              </span>
            </div>
          </div>

          {/* 2. Marital & Family Status */}
          <div className="space-y-2.5">
            <label className="font-serif font-bold text-sm text-foreground block">
              Marital & Family Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: "Single", title: "Single", desc: "Agility & Power" },
                { id: "Married", title: "Married", desc: "Comfort & Balance" },
                { id: "Married with Kids", title: "Married w/ Kids", desc: "Safety & 6+ Seats" },
                { id: "Joint Family", title: "Joint Family", desc: "Maximum Capacity" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMaritalStatus(item.id as any)}
                  className={`p-3 text-left border rounded-xl transition-all cursor-pointer ${
                    maritalStatus === item.id
                      ? "border-brand bg-brand/5 shadow-xs ring-1 ring-brand"
                      : "border-ivory-border bg-ivory-bg/30 hover:border-brand/40"
                  }`}
                >
                  <strong className={`block text-xs font-serif ${maritalStatus === item.id ? "text-brand" : "text-foreground"}`}>
                    {item.title}
                  </strong>
                  <span className="text-[10px] text-ivory-text-muted block mt-0.5">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Living Environment & Terrain */}
          <div className="space-y-2.5">
            <label className="font-serif font-bold text-sm text-foreground block">
              Primary Driving Environment / Terrain
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "Metro / City",
                  icon: "🏙️",
                  title: "Metro / Dense City",
                  desc: "Start-stop traffic, tight parking, priority on urban agility & high mileage.",
                },
                {
                  id: "Suburban / Highway",
                  icon: "🛣️",
                  title: "Suburban & Highway",
                  desc: "Expressway driving, higher speeds, cruise comfort, stability.",
                },
                {
                  id: "Hilly / Rough Terrain",
                  icon: "⛰️",
                  title: "Hilly / Rough Roads",
                  desc: "Requires ground clearance (>190mm), tough suspension, AWD/4x4 capability.",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLocationType(item.id as any)}
                  className={`p-3.5 text-left border rounded-xl transition-all cursor-pointer ${
                    locationType === item.id
                      ? "border-brand bg-brand/5 shadow-xs ring-1 ring-brand"
                      : "border-ivory-border bg-ivory-bg/30 hover:border-brand/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{item.icon}</span>
                    <strong className={`text-xs font-serif ${locationType === item.id ? "text-brand" : "text-foreground"}`}>
                      {item.title}
                    </strong>
                  </div>
                  <span className="text-[11px] text-ivory-text-muted block leading-snug">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Primary Driving Priority */}
          <div className="space-y-2.5">
            <label className="font-serif font-bold text-sm text-foreground block">
              Primary Driving Priority
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "Daily Commute",
                  title: "Daily Commute & Efficiency",
                  desc: "Low running cost, smooth automatic/manual, easy maneuverability.",
                },
                {
                  id: "Family Road Trips",
                  title: "Family Travel & Luggage Space",
                  desc: "Generous legroom, boot space, 5-star crash safety ratings.",
                },
                {
                  id: "Performance Enthusiast",
                  title: "Performance & Spirited Driving",
                  desc: "High horsepower, instant torque, quick acceleration, sporty handling.",
                },
                {
                  id: "Rural / Rough Roads",
                  title: "Rugged Durability & Off-Road",
                  desc: "Built to conquer potholes, unpaved gravel, and steep inclines.",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPrimaryUsage(item.id as any)}
                  className={`p-3.5 text-left border rounded-xl transition-all cursor-pointer ${
                    primaryUsage === item.id
                      ? "border-brand bg-brand/5 shadow-xs ring-1 ring-brand"
                      : "border-ivory-border bg-ivory-bg/30 hover:border-brand/40"
                  }`}
                >
                  <strong className={`block text-xs font-serif ${primaryUsage === item.id ? "text-brand" : "text-foreground"}`}>
                    {item.title}
                  </strong>
                  <span className="text-[11px] text-ivory-text-muted block mt-0.5 leading-snug">
                    {item.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Live AI Latent Vector Projection (Explainability) */}
          <div className="p-4 bg-ivory-bg/80 border border-ivory-border rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-brand flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                Live 7D Demographic Prior Vector (pgvector)
              </span>
              <span className="font-mono text-[9px] text-ivory-text-muted">
                Initial Cosine Coordinates
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: "Family Safety", val: projectedVector.familySafety },
                { label: "Terrain Clearance", val: projectedVector.terrainClearance },
                { label: "Urban Agility", val: projectedVector.urbanAgility },
                { label: "Power & Speed", val: projectedVector.performancePower },
                { label: "Fuel Economy", val: projectedVector.fuelEfficiency },
                { label: "Tech & Comfort", val: projectedVector.techComfort },
                { label: "Affordability", val: projectedVector.affordability },
              ].map((dim, idx) => (
                <div key={idx} className="bg-white p-2 rounded-lg border border-ivory-border/60">
                  <div className="flex justify-between text-[10px] font-mono text-ivory-text-muted mb-1">
                    <span>{dim.label}</span>
                    <strong className="text-foreground">{Math.round(dim.val * 100)}%</strong>
                  </div>
                  <div className="h-1.5 w-full bg-ivory-border/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-300"
                      style={{ width: `${Math.round(dim.val * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-brand hover:bg-brand-dark text-white font-mono text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? "Calculating Vector & Ranking Catalog..." : "Save Preferences & Generate Recommendations →"}</span>
            </button>
            <p className="text-center font-serif text-[11px] italic text-ivory-text-muted mt-2">
              This setup is one-time only. Once saved, your preferences are permanently stored in Neon DB.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
