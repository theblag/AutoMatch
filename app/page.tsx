"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserPreferences } from "./data";
import { carsDatabase } from "./data";
import TelemetryQuiz from "./components/TelemetryQuiz";
import HeaderAuth from "./components/HeaderAuth";
import AuthModal from "./components/AuthModal";

export default function Home() {
  const router = useRouter();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleQuizComplete = (preferences: UserPreferences) => {
    sessionStorage.setItem(
      "automatch-recommendations",
      JSON.stringify({
        preferences,
        budget: preferences.budget,
        types: preferences.types,
        fuels: preferences.fuels,
      }),
    );
    router.push("/recommendations");
  };

  return (
    <div className="min-h-screen bg-editorial-pattern text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ivory-border bg-white/85 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-serif text-sm font-bold uppercase tracking-widest">
            AUTOMATCH <span className="italic text-brand">{"//"}</span> CURATOR
          </span>
          <span className="hidden font-mono text-[9px] uppercase tracking-wider text-ivory-text-muted sm:block">
            {carsDatabase.length.toLocaleString("en-IN")} catalog variants
          </span>
        </div>
        <HeaderAuth />
      </header>

      {/* Main Hero Container */}
      <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-7xl flex-col justify-center px-4 py-10 md:px-8">
        {!isQuizOpen ? (
          <section className="mx-auto max-w-3xl space-y-8 py-10 text-center">
            <div className="inline-flex items-center gap-2 border border-brand/30 bg-brand/5 px-4 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-brand rounded-full">
              <span>✦ Powered by Neon PostgreSQL + pgvector</span>
            </div>
            <div className="space-y-4">
              <h1 className="font-serif text-4xl font-semibold leading-tight md:text-6xl">
                Find the drive that fits
                <span className="block italic text-brand">
                  your lifestyle priors.
                </span>
              </h1>
              <p className="mx-auto max-w-xl font-serif text-sm italic leading-relaxed text-ivory-text-muted md:text-base">
                An intelligent recommendation engine utilizing cold-start demographic priors,
                7-dimensional latent embeddings, and real-time search telemetry to rank 1,278 real vehicles.
              </p>
            </div>

            {/* Spec Stats Box */}
            <div className="grid grid-cols-3 border-y border-ivory-border bg-white/75 py-4 font-mono text-[9px] uppercase tracking-wider text-ivory-text-muted">
              <div>
                <strong className="mb-1 block font-serif text-xl text-brand">
                  {carsDatabase.length.toLocaleString("en-IN")}
                </strong>
                real cars
              </div>
              <div>
                <strong className="mb-1 block font-serif text-xl text-brand">
                  7D
                </strong>
                latent vector space
              </div>
              <div>
                <strong className="mb-1 block font-serif text-xl text-brand">
                  pgvector
                </strong>
                cosine ranker
              </div>
            </div>

            {/* Action Buttons with Sign Up / Profile Modal Trigger */}
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="bg-brand px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand rounded-lg shadow-sm"
              >
                Sign Up / Setup Profile
              </button>
              <Link
                href="/recommendations"
                className="border border-brand/30 bg-white px-8 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-brand transition-colors hover:bg-brand/5 rounded-lg"
              >
                Browse Recommendations
              </Link>
              <button
                type="button"
                onClick={() => setIsQuizOpen(true)}
                className="border border-ivory-border bg-white px-6 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-ivory-text-muted transition-colors hover:bg-ivory-bg rounded-lg"
              >
                Manual Quiz
              </button>
            </div>
          </section>
        ) : (
          <section className="py-4">
            <TelemetryQuiz onComplete={handleQuizComplete} />
          </section>
        )}
      </main>

      {/* Auth Modal Triggerable directly from Home */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
