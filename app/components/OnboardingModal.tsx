"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { AuthUser, UserVectorData } from "@/lib/types";

interface OnboardingModalProps {
  isOpen: boolean;
  user: AuthUser | null;
  onCompleted: (user: AuthUser, vector: UserVectorData) => void;
  onDismiss?: () => void;
}

export default function OnboardingModal({
  isOpen,
  user,
  onCompleted,
  onDismiss,
}: OnboardingModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cold-Start Lifestyle Profile Fields
  const [age, setAge] = useState(user?.age || 29);
  const [maritalStatus, setMaritalStatus] = useState<
    "Single" | "Married" | "Married with Kids" | "Joint Family"
  >((user?.maritalStatus as any) || "Married with Kids");
  const [locationType, setLocationType] = useState<
    "Metro / City" | "Suburban / Highway" | "Hilly / Rough Terrain"
  >((user?.locationType as any) || "Hilly / Rough Terrain");
  const [primaryUsage, setPrimaryUsage] = useState<
    | "Daily Commute"
    | "Family Road Trips"
    | "Performance Enthusiast"
    | "Rural / Rough Roads"
  >((user?.primaryUsage as any) || "Family Road Trips");
  const [budgetMax, setBudgetMax] = useState(user?.budgetMax || 2500000);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
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
        throw new Error(data.error || "Failed to save profile");
      }

      onCompleted(data.user, data.vector);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save driving profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white border border-ivory-border shadow-2xl rounded-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-ivory-border bg-ivory-bg/60 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-wider font-bold text-brand block">
              ✦ One-Time Profile Setup
            </span>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="text-ivory-text-muted hover:text-foreground text-sm font-mono"
              >
                Skip for now
              </button>
            )}
          </div>
          <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
            Welcome, {user?.name || "Driver"}!
          </h2>
          <p className="text-xs text-ivory-text-muted mt-1 leading-relaxed">
            Since your account is brand new, set your lifestyle priors once.
            Our engine uses this to eliminate the cold-start problem and personalize all 1,278 vehicles.
          </p>
        </div>


        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-foreground">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-sans rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ivory-text-muted mb-1">
                Your Age ({age} yrs)
              </label>
              <input
                type="range"
                min={18}
                max={75}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full accent-brand"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ivory-text-muted mb-1">
                Household / Marital Status
              </label>
              <select
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs border-2 border-ivory-border rounded-md bg-white focus:outline-brand focus:border-brand"
              >
                <option value="Single">Single (Compact & Fun)</option>
                <option value="Married">Married (Couple Travel)</option>
                <option value="Married with Kids">
                  Family with Kids (Safety / ISOFIX)
                </option>
                <option value="Joint Family">
                  Joint Family (6–8 Seaters)
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ivory-text-muted mb-1">
                Primary Driving Terrain
              </label>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs border-2 border-ivory-border rounded-md bg-white focus:outline-brand focus:border-brand"
              >
                <option value="Metro / City">
                  Metro (City Traffic / Automatic)
                </option>
                <option value="Suburban / Highway">
                  Suburban & Highway Commute
                </option>
                <option value="Hilly / Rough Terrain">
                  Hilly / Mountainous (AWD / Clearance)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ivory-text-muted mb-1">
                Driving Goal
              </label>
              <select
                value={primaryUsage}
                onChange={(e) => setPrimaryUsage(e.target.value as any)}
                className="w-full px-2 py-1.5 text-xs border-2 border-ivory-border rounded-md bg-white focus:outline-brand focus:border-brand"
              >
                <option value="Daily Commute">
                  Daily Commute (Efficiency)
                </option>
                <option value="Family Road Trips">
                  Family Road Trips (Utility)
                </option>
                <option value="Performance Enthusiast">
                  Spirited Performance (Power)
                </option>
                <option value="Rural / Rough Roads">
                  Rural / High Clearance (Rugged)
                </option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono uppercase text-ivory-text-muted mb-1">
              <span>Target Budget Ceiling</span>
              <span className="font-bold text-foreground">
                ₹{(budgetMax / 100000).toFixed(1)} Lakhs
              </span>
            </div>
            <input
              type="range"
              min={400000}
              max={12000000}
              step={100000}
              value={budgetMax}
              onChange={(e) => setBudgetMax(Number(e.target.value))}
              className="w-full accent-brand"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-brand text-white font-mono text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-50 shadow-sm"
            >
              {isLoading
                ? "Saving to Neon DB & Seeding Vector..."
                : "Save Profile & Unlock Personalized Feed"}
            </button>
            <p className="text-[10px] font-mono text-center text-ivory-text-muted mt-2">
              ✓ This prompt only appears once. You can update it anytime in settings.
            </p>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
